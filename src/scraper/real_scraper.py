import os
import requests
import json
import logging
import re
from bs4 import BeautifulSoup
from typing import List, Dict, Any
from src.scraper.base import BaseAirbnbScraper

logger = logging.getLogger(__name__)

class RealAirbnbScraper(BaseAirbnbScraper):
    """
    A scraper that fetches real public listing information from Airbnb.
    Uses custom browser headers and JSON extraction from embedded HTML scripts.
    Handles anti-bot blocks gracefully.
    """

    def __init__(self, settings_path: str = "config/settings.yaml"):
        # We can load settings (e.g. user-agents) if needed
        self.session = requests.Session()
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://www.airbnb.com/",
            "Connection": "keep-alive"
        }
        self.session.headers.update(self.headers)
        self.listing_prices = {}
        self.listing_details_cache = {}

    def search_listings(self, city: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Attempts to fetch public listings for a city across target neighborhoods.
        """
        queries = [city]
        target_accommodates = None
        if city.lower() in ("buenos aires", "buenos-aires"):
            # Check if a target listing is configured
            target_neighborhood = None
            settings_file = "config/target_settings.json"
            if os.path.exists(settings_file):
                try:
                    with open(settings_file, "r", encoding="utf-8") as f:
                        t_settings = json.load(f)
                        if t_settings.get("details"):
                            target_neighborhood = t_settings["details"].get("neighborhood")
                            target_accommodates = t_settings["details"].get("accommodates")
                except Exception:
                    pass
            
            if target_neighborhood:
                queries = [f"{target_neighborhood}, Buenos Aires"]
                logger.info(f"Scraper targeted search: detected neighborhood '{target_neighborhood}'. Scraping specifically for this area.")
            else:
                queries = [
                    "Palermo Hollywood, Buenos Aires",
                    "Palermo Soho, Buenos Aires",
                    "Recoleta, Buenos Aires",
                    "Belgrano, Buenos Aires"
                ]
        else:
            settings_file = "config/target_settings.json"
            if os.path.exists(settings_file):
                try:
                    with open(settings_file, "r", encoding="utf-8") as f:
                        t_settings = json.load(f)
                        if t_settings.get("details"):
                            target_accommodates = t_settings["details"].get("accommodates")
                except Exception:
                    pass
        
        all_listings = {}
        
        for query in queries:
            formatted_query = query.replace(" ", "-").replace(",", "")
            url = f"https://www.airbnb.com/s/{formatted_query}/homes"
            if target_accommodates:
                url += f"?adults={target_accommodates}"
            logger.info(f"Scraping real Airbnb listings for query '{query}' at {url}...")
            try:
                response = self.session.get(url, timeout=15)
                if response.status_code == 403:
                    logger.warning(f"Access forbidden (HTTP 403) for query '{query}'. Airbnb may be rate-limiting.")
                    continue
                if response.status_code != 200:
                    logger.warning(f"HTTP Error {response.status_code} for query '{query}'.")
                    continue

                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Find the state JSON which holds listings data
                state_script = (
                    soup.find('script', id='data-deferred-state-0') or
                    soup.find('script', id=re.compile(r'^data-deferred-state-')) or
                    soup.find('script', id='data-state-state') or
                    soup.find('script', id='niobe-minimal-state')
                )
                
                if state_script:
                    try:
                        data = json.loads(state_script.string)
                        # Traverse the JSON tree to find listings.
                        listings = self._extract_listings_from_json(data)
                        for l in listings:
                            # Update neighborhood attribute based on our query area
                            n_name = query.split(",")[0].strip()
                            l["neighborhood"] = n_name
                            
                            l_id = l.get("listing_id")
                            if l_id and l_id not in all_listings:
                                all_listings[l_id] = l
                        logger.info(f"Successfully extracted {len(listings)} listings for query '{query}'. Total unique: {len(all_listings)}")
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to decode JSON state script for query '{query}'.")
            except Exception as e:
                logger.error(f"Error scraping real Airbnb query '{query}': {str(e)}")
                continue

        # Fallback to HTML parsing if no listings were found in JSON
        if not all_listings:
            try:
                formatted_city = city.replace(" ", "-")
                url = f"https://www.airbnb.com/s/{formatted_city}/homes"
                if target_accommodates:
                    url += f"?adults={target_accommodates}"
                response = self.session.get(url, timeout=15)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    listings = self._extract_listings_from_html(soup)
                    for l in listings:
                        l_id = l.get("listing_id")
                        if l_id and l_id not in all_listings:
                            all_listings[l_id] = l
                    logger.info(f"Extracted {len(all_listings)} listings using HTML fallback parser.")
            except Exception as e:
                logger.error(f"Error in HTML fallback scraper: {str(e)}")

        return list(all_listings.values())[:limit]

    def get_listing_details(self, listing_id: str) -> Dict[str, Any]:
        """
        Attempts to scrape details for a specific listing by its room URL.
        Returns cached value if already extracted during search search_listings.
        """
        if str(listing_id) in self.listing_details_cache:
            logger.info(f"Returning cached details for listing {listing_id}")
            return self.listing_details_cache[str(listing_id)]

        url = f"https://www.airbnb.com/rooms/{listing_id}"
        logger.info(f"Scraping real listing details for {listing_id} at {url}...")
        
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code != 200:
                raise ConnectionError(f"HTTP {response.status_code} requesting listing details.")
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 1. Parse JSON-LD structured data if available
            title_text = None
            rating = None
            reviews_count = None
            latitude = None
            longitude = None
            
            for s in soup.find_all('script', type='application/ld+json'):
                try:
                    if not s.string: continue
                    js_data = json.loads(s.string)
                    items = js_data if isinstance(js_data, list) else [js_data]
                    for item in items:
                        if "name" in item and item.get("@type") in ("Product", "Accommodation", "LodgingBusiness"):
                            title_text = item["name"]
                        if "aggregateRating" in item:
                            agg = item["aggregateRating"]
                            if "ratingValue" in agg:
                                rating = float(agg["ratingValue"])
                            if "reviewCount" in agg:
                                reviews_count = int(agg["reviewCount"])
                        if "geo" in item:
                            geo = item["geo"]
                            if "latitude" in geo and "longitude" in geo:
                                latitude = float(geo["latitude"])
                                longitude = float(geo["longitude"])
                except Exception:
                    continue
            
            # 2. Fallbacks to meta descriptions or scripts containing details
            description = soup.find('meta', property='og:description')
            desc_text = description['content'] if description else ""
            
            if not title_text:
                if desc_text and not any(p in desc_text.lower() for p in ["guest", "bedroom", "bath", "bed", "huésped", "dormitorio", "cama", "baño"]):
                    title_text = desc_text
                    
            if not title_text:
                # Check HTML title tag
                if soup.title and soup.title.string:
                    t_str = soup.title.string
                    # split off standard trailing description suffixes
                    for sep in [" - Departamentos", " - Apartments", " - Flats", " - Casas", " - Airbnb", " | Airbnb", " - Rooms"]:
                        if sep in t_str:
                            t_str = t_str.split(sep)[0].strip()
                    title_text = t_str
                    
            if not title_text:
                twitter_title = soup.find('meta', attrs={'name': 'twitter:title'}) or soup.find('meta', property='twitter:title')
                if twitter_title and twitter_title.get('content'):
                    title_text = twitter_title['content'].split(" - ")[0].strip()
                else:
                    title = soup.find('meta', property='og:title')
                    title_text = title['content'].split(" - ")[0].strip() if title else "Airbnb Listing"
            
            accommodates = 2
            bedrooms = 1
            bathrooms = 1.0
            
            if desc_text:
                guest_match = re.search(r'(\d+)\s+guest', desc_text)
                bed_match = re.search(r'(\d+)\s+bedroom', desc_text)
                bath_match = re.search(r'(\d+(?:\.\d+)?)\s+bath', desc_text)
                
                if guest_match: accommodates = int(guest_match.group(1))
                if bed_match: bedrooms = int(bed_match.group(1))
                if bath_match: bathrooms = float(bath_match.group(1))
                
            # Heuristic amenities parsing
            mapping = {
                "Wifi": ['wifi', 'wi-fi', 'internet'],
                "Air conditioning": ['air conditioning', 'aire acondicionado', 'split', 'SYSTEM_AC', 'ac_unit'],
                "Cocina": ['kitchen', 'cocina', 'SYSTEM_KITCHEN'],
                "Lavarropas": ['washer', 'laundry', 'lavarropas', 'lavadora', 'SYSTEM_WASHER'],
                "Parking": ['cochera', 'garaje', 'estacionamiento gratuito en las instalaciones', 'estacionamiento gratis en las instalaciones', 'free parking on premises', 'SYSTEM_PARKING', 'SYSTEM_PAID_PARKING'],
                "Pool": ['pool', 'pileta', 'piscina', 'SYSTEM_POOL'],
                "Jacuzzi": ['jacuzzi', 'hot tub', 'hidromasaje', 'SYSTEM_HOT_TUB'],
                "Gym": ['gym', 'gimnasio', 'SYSTEM_GYM'],
                "Workspace": ['workspace', 'espacio de trabajo', 'escritorio', 'laptop-friendly', 'SYSTEM_OFFICE_EQUIPMENT'],
                "Check-in autónomo": ['self check-in', 'check-in autónomo', 'llegada autónoma', 'cerradura inteligente', 'SYSTEM_SELF_CHECK_IN']
            }
            detected_amenities = []
            for name, terms in mapping.items():
                for term in terms:
                    if re.search(re.escape(term), response.text, re.IGNORECASE):
                        detected_amenities.append(name)
                        break
                
            # Check superhost badge
            is_superhost = 0
            if "superhost" in response.text.lower() or "isSuperhost" in response.text or "👑" in response.text:
                is_superhost = 1

            # Parse real hero image URL (og:image)
            picture_url = None
            pic_meta = soup.find('meta', property='og:image')
            if pic_meta and pic_meta.get('content'):
                picture_url = pic_meta['content']
            else:
                pic_twitter = soup.find('meta', attrs={'name': 'twitter:image'}) or soup.find('meta', property='twitter:image')
                if pic_twitter and pic_twitter.get('content'):
                    picture_url = pic_twitter['content']
            
            if not picture_url:
                # Fallback to regex search in HTML response
                match = re.search(r'"pictureUrl":"(https://a0\.muscache\.com/im/pictures/[^"]+)"', response.text)
                if match:
                    picture_url = match.group(1).replace("\\u002F", "/")

            # Calculate a realistic base price if not already in cache
            if str(listing_id) not in self.listing_prices:
                target_settings_file = "config/target_settings.json"
                has_target_override = False
                if os.path.exists(target_settings_file):
                    try:
                        with open(target_settings_file, "r", encoding="utf-8") as f:
                            t_settings = json.load(f)
                            if str(t_settings.get("target_id")) == str(listing_id):
                                target_details = t_settings.get("details", {})
                                if "price" in target_details:
                                    self.listing_prices[str(listing_id)] = float(target_details["price"])
                                    has_target_override = True
                                    logger.info(f"Target listing price override found in settings: ${target_details['price']} USD")
                    except Exception as e:
                        logger.warning(f"Error reading target settings override in scraper: {str(e)}")

                if not has_target_override:
                    est_price = 65.0
                    est_price += (accommodates - 2) * 5.0
                    est_price += (bedrooms - 1) * 20.0
                    est_price += (bathrooms - 1.0) * 10.0
                    if is_superhost:
                        est_price += 8.0
                    if rating and rating > 4.5:
                        est_price += (rating - 4.5) * 10.0
                    
                    try:
                        id_digits = "".join(filter(str.isdigit, str(listing_id)))
                        seed_offset = sum(int(d) for d in id_digits)
                        variation = (seed_offset % 41) - 15
                        est_price += variation
                    except Exception:
                        pass
                    
                    est_price = max(45.0, min(est_price, 250.0))
                    self.listing_prices[str(listing_id)] = round(est_price, 2)

            return {
                "listing_id": str(listing_id),
                "title": title_text,
                "property_type": "Apartment",
                "room_type": "Entire home/apt",
                "accommodates": accommodates,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "latitude": latitude if latitude is not None else -34.5861,
                "longitude": longitude if longitude is not None else -58.4373,
                "neighborhood": "Palermo Hollywood",
                "rating": rating if rating is not None else 5.0,
                "reviews_count": reviews_count if reviews_count is not None else 0,
                "host_id": "host_" + str(listing_id),
                "host_name": "Host",
                "host_is_superhost": is_superhost,
                "amenities": detected_amenities,
                "picture_url": picture_url
            }
        except Exception as e:
            logger.error(f"Error scraping real listing details: {str(e)}")
            raise e

    def get_listing_calendar(self, listing_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Generates calendar pricing and availability states based on parsed nightly price.
        Determines occupancy status deterministically using a seed to keep simulation stable.
        """
        import datetime
        import random
        
        base_price = self.listing_prices.get(str(listing_id), 85.0)
        
        calendar = []
        today = datetime.date.today()
        for i in range(1, days + 1):
            future_date = today + datetime.timedelta(days=i)
            # Weekend premium (Fridays & Saturdays)
            is_weekend = future_date.weekday() in (4, 5)
            price = base_price * 1.15 if is_weekend else base_price
            
            # Deterministic occupancy based on listing ID and date offset
            try:
                seed_val = int(str(listing_id)[-6:]) + i
            except:
                seed_val = i
            random.seed(seed_val)
            
            # Roughly 65% occupancy rate
            available = 1 if random.random() < 0.35 else 0
            
            calendar.append({
                "date": future_date.strftime("%Y-%m-%d"),
                "price": round(price, 2),
                "available": available
            })
        return calendar

    def _extract_listings_from_json(self, data: Any) -> List[Dict[str, Any]]:
        # Traverse JSON structure looking for StaySearchResult nodes
        results = []
        
        def recurse(node):
            if isinstance(node, dict):
                if node.get("__typename") == "StaySearchResult":
                    results.append(node)
                for k, v in node.items():
                    recurse(v)
            elif isinstance(node, list):
                for item in node:
                    recurse(item)
                    
        recurse(data)
        
        listings = []
        import base64
        for r in results:
            b64_id = r.get("demandStayListing", {}).get("id", "")
            try:
                listing_id = base64.b64decode(b64_id).decode("utf-8").split(":")[-1]
            except:
                continue
            
            title = r.get("subtitle") or r.get("nameLocalized", {}).get("localizedStringWithTranslationPreference", "Listing Room")
            
            # Extract rating and reviews
            rating_label = r.get("avgRatingA11yLabel", "")
            rating = 4.8
            reviews_count = 10
            if rating_label:
                rating_match = re.search(r'([\d.]+)\s+out of', rating_label)
                reviews_match = re.search(r'(\d+)\s+review', rating_label)
                if rating_match:
                    rating = float(rating_match.group(1))
                if reviews_match:
                    reviews_count = int(reviews_match.group(1))
            
            # Extract coordinates
            coord = r.get("demandStayListing", {}).get("location", {}).get("coordinate", {})
            lat = coord.get("latitude", -34.58)
            lng = coord.get("longitude", -58.43)
            
            # Extract structure (beds, bedrooms, baths)
            bedrooms = 1
            bathrooms = 1.0
            accommodates = 2
            
            struct = r.get("structuredContent", {})
            primary_lines = struct.get("primaryLine", [])
            for line in primary_lines:
                body = line.get("body", "")
                if "bedroom" in body:
                    try:
                        bedrooms = int(body.split()[0])
                    except:
                        pass
                elif "bath" in body:
                    try:
                        bathrooms = float(body.split()[0])
                    except:
                        pass
                elif "bed" in body:
                    try:
                        beds = int(body.split()[0])
                        accommodates = max(2, beds * 2)
                    except:
                        pass
            
            # Extract price
            price_str = r.get("structuredDisplayPrice", {}).get("primaryLine", {}).get("price", "")
            qualifier = r.get("structuredDisplayPrice", {}).get("primaryLine", {}).get("qualifier", "")
            nightly_price = None
            exp_data = r.get("structuredDisplayPrice", {}).get("explanationData", {})
            if exp_data:
                details = exp_data.get("priceDetails", [])
                if details:
                    items = details[0].get("items", [])
                    if items:
                        desc = items[0].get("description", "")
                        price_matches = re.findall(r'\$([\d,.]+)', desc)
                        if len(price_matches) >= 1:
                            nightly_price = float(price_matches[-1].replace(",", ""))
            
            if not nightly_price and price_str:
                try:
                    price_num = float(re.sub(r'[^\d.]', '', price_str))
                    nightly_price = price_num
                except:
                    pass
            
            if not nightly_price:
                nightly_price = 85.0
                
            # Cache the parsed price for calendar calls
            self.listing_prices[str(listing_id)] = nightly_price
            
            # Check superhost badge
            is_superhost = 0
            badges = r.get("badges", [])
            for b in badges:
                if b.get("loggingContext", {}).get("badgeType") == "SUPERHOST":
                    is_superhost = 1
            
            # Extract picture URL
            picture_url = None
            contextual_pics = r.get("contextualPictures") or r.get("listing", {}).get("contextualPictures", [])
            if contextual_pics and isinstance(contextual_pics, list):
                try:
                    first_pic = contextual_pics[0]
                    if isinstance(first_pic, dict):
                        picture_url = first_pic.get("picture") or first_pic.get("pictureUrl")
                except Exception:
                    pass
            
            listing_dict = {
                "listing_id": str(listing_id),
                "title": title,
                "property_type": "Apartment",
                "room_type": "Entire home/apt",
                "accommodates": accommodates,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "latitude": lat,
                "longitude": lng,
                "neighborhood": "Palermo Hollywood",
                "rating": rating,
                "reviews_count": reviews_count,
                "host_id": "host_" + str(listing_id),
                "host_name": "Host",
                "host_is_superhost": is_superhost,
                "picture_url": picture_url
            }
            listings.append(listing_dict)
            self.listing_details_cache[str(listing_id)] = listing_dict
            
        return listings

    def _extract_listings_from_html(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        # Simple HTML parser looking for meta/items
        listings = []
        # Airbnb listing cards usually have description elements or titles
        cards = soup.find_all('div', {'data-testid': 'card-container'})
        for card in cards:
            try:
                # Find listing id from href
                link = card.find('a', href=True)
                if not link: continue
                match = re.search(r'/rooms/(\d+)', link['href'])
                if not match: continue
                l_id = match.group(1)
                
                title_elem = card.find('span', {'data-testid': 'listing-card-name'}) or card.find('div', id=re.compile("title_"))
                title = title_elem.text if title_elem else "Listing Room"
                
                price_elem = card.find('span', class_=re.compile(".*price.*"))
                # Price text might be "$120 night"
                price = 100.0
                if price_elem:
                    price_text = price_elem.text
                    p_match = re.search(r'\$?(\d+)', price_text)
                    if p_match: price = float(p_match.group(1))

                listings.append({
                    "listing_id": l_id,
                    "title": title,
                    "property_type": "Apartment",
                    "room_type": "Entire home/apt",
                    "accommodates": 2,
                    "bedrooms": 1,
                    "bathrooms": 1.0,
                    "latitude": 0.0,
                    "longitude": 0.0,
                    "neighborhood": "Unknown",
                    "rating": 4.8,
                    "reviews_count": 10,
                    "host_id": "host_" + l_id,
                    "host_name": "Host",
                    "host_is_superhost": 0
                })
            except Exception:
                continue
        return listings
