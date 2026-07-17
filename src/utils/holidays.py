import requests
import logging
from datetime import date, datetime
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

# Global cache to prevent multiple network requests during training loops
_holidays_cache = {}

def get_argentine_holidays_map(year: int) -> dict:
    """
    Returns a dictionary of Argentine holidays for a given year.
    First tries to fetch dynamically from api.argentinadatos.com,
    falling back to a static mapping on failure or timeout.
    """
    if year in _holidays_cache:
        return _holidays_cache[year]

    # Try fetching dynamically
    try:
        url = f"https://api.argentinadatos.com/v1/feriados/{year}"
        # Set a short timeout to prevent blocking if API is slow or offline
        response = requests.get(url, timeout=2.0)
        if response.status_code == 200:
            data = response.json()
            holidays_map = {}
            for item in data:
                # API date format: "YYYY-MM-DD"
                try:
                    dt = datetime.strptime(item["fecha"], "%Y-%m-%d").date()
                    # Map month, day to holiday name
                    holidays_map[(dt.month, dt.day)] = item["nombre"]
                except Exception:
                    continue
            if holidays_map:
                logger.info(f"Loaded {len(holidays_map)} Argentine holidays dynamically for {year} from ArgentinaDatos API.")
                _holidays_cache[year] = holidays_map
                return holidays_map
    except Exception as e:
        logger.warning(f"Could not fetch Argentine holidays dynamically for {year}: {str(e)}. Using static fallback.")

    # Static Fallback
    holidays = {
        (1, 1): "Año Nuevo",
        (3, 24): "Día de la Memoria",
        (4, 2): "Día de Malvinas",
        (5, 1): "Día del Trabajador",
        (5, 25): "Revolución de Mayo",
        (6, 20): "Día de la Bandera",
        (7, 9): "Día de la Independencia",
        (12, 8): "Inmaculada Concepción",
        (12, 25): "Navidad"
    }

    if year == 2026:
        holidays[(2, 16)] = "Feriado de Carnaval"
        holidays[(2, 17)] = "Feriado de Carnaval"
        holidays[(3, 23)] = "Feriado Puente Turístico"
        holidays[(4, 3)] = "Viernes Santo"
        holidays[(6, 15)] = "Paso a la Inmortalidad del Gral. Güemes"
        holidays[(7, 10)] = "Feriado Puente Turístico"
        holidays[(8, 17)] = "Paso a la Inmortalidad del Gral. San Martín"
        holidays[(10, 12)] = "Día del Respeto a la Diversidad Cultural"
        holidays[(11, 23)] = "Día de la Soberanía Nacional"
        holidays[(12, 7)] = "Feriado Puente Turístico"
    elif year == 2027:
        holidays[(2, 8)] = "Feriado de Carnaval"
        holidays[(2, 9)] = "Feriado de Carnaval"
        holidays[(3, 26)] = "Viernes Santo"
        holidays[(6, 21)] = "Paso a la Inmortalidad del Gral. Güemes"
        holidays[(7, 8)] = "Feriado Puente Turístico"
        holidays[(8, 16)] = "Paso a la Inmortalidad del Gral. San Martín"
        holidays[(10, 11)] = "Día del Respeto a la Diversidad Cultural"
        holidays[(11, 22)] = "Día de la Soberanía Nacional"
        holidays[(12, 24)] = "Feriado Puente Turístico"

    _holidays_cache[year] = holidays
    return holidays

def is_argentine_holiday(d: date) -> Tuple[bool, Optional[str]]:
    """
    Checks if a given date is an Argentine holiday.
    Returns: (is_holiday: bool, holiday_name: str or None)
    """
    if isinstance(d, str):
        try:
            d = datetime.strptime(d, "%Y-%m-%d").date()
        except ValueError:
            return False, None
            
    year = d.year
    month = d.month
    day = d.day
    
    holidays_map = get_argentine_holidays_map(year)
    key = (month, day)
    
    if key in holidays_map:
        return True, holidays_map[key]
        
    return False, None

if __name__ == "__main__":
    # Test script execution
    logging.basicConfig(level=logging.INFO)
    test_dates = [
        date(2026, 7, 9), # Día de la Independencia (Fixed)
        date(2026, 7, 10), # Puente Turístico (Dynamic from API!)
        date(2026, 12, 25), # Navidad (Fixed)
        date(2026, 7, 14), # Random non-holiday
    ]
    for td in test_dates:
        is_h, name = is_argentine_holiday(td)
        print(f"{td}: Holiday? {is_h} ({name})")
