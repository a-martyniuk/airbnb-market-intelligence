from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseAirbnbScraper(ABC):
    """
    Abstract base class for Airbnb data extraction.
    Provides a consistent interface for both the real web scraper and mock simulator.
    """

    @abstractmethod
    def search_listings(self, city: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Search for public listings in a specific city.
        Returns a list of listing dictionaries containing summary information.
        """
        pass

    @abstractmethod
    def get_listing_details(self, listing_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific listing.
        """
        pass

    @abstractmethod
    def get_listing_calendar(self, listing_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Retrieve future pricing and availability for a listing.
        Returns a list of dictionaries with keys: date (YYYY-MM-DD), price (float), available (bool).
        """
        pass
