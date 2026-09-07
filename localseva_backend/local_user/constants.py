"""
Constants for local_user app.
Defines canonical supported locations for the Mumbai Western Line corridor.
"""

WESTERN_LINE_LOCATIONS = [
    "Churchgate",
    "Marine Lines",
    "Charni Road",
    "Grant Road",
    "Mumbai Central",
    "Mahalaxmi",
    "Lower Parel",
    "Prabhadevi",
    "Dadar",
    "Matunga Road",
    "Mahim",
    "Bandra",
    "Khar Road",
    "Santacruz",
    "Vile Parle",
    "Andheri",
    "Jogeshwari",
    "Ram Mandir",
    "Goregaon",
    "Malad",
    "Kandivali",
    "Borivali",
    "Dahisar",
    "Mira Road",
    "Bhayandar",
    "Naigaon",
    "Vasai Road",
    "Nalasopara",
    "Virar",
]

LOCATION_CHOICES = [(loc, loc) for loc in WESTERN_LINE_LOCATIONS]

# Normalization map for case-insensitivity and known colloquial aliases
LOCATION_LOOKUP = {loc.lower(): loc for loc in WESTERN_LINE_LOCATIONS}

# Common colloquial or legacy variations mapped to canonical names
LOCATION_ALIASES = {
    "bhayender": "Bhayandar",
    "bhayander": "Bhayandar",
    "bhayander west": "Bhayandar",
    "bhayandar east": "Bhayandar",
    "bhayender west": "Bhayandar",
    "bhayender east": "Bhayandar",
    "mira road east": "Mira Road",
    "mira road west": "Mira Road",
    "borivali west": "Borivali",
    "borivali east": "Borivali",
    "kandivali west": "Kandivali",
    "kandivali east": "Kandivali",
    "malad west": "Malad",
    "malad east": "Malad",
    "goregaon west": "Goregaon",
    "goregaon east": "Goregaon",
    "andheri west": "Andheri",
    "andheri east": "Andheri",
    "bandra west": "Bandra",
    "bandra east": "Bandra",
    "dadar west": "Dadar",
    "dadar east": "Dadar",
    "elphinstone": "Prabhadevi",
    "elphinstone road": "Prabhadevi",
    "mahim junction": "Mahim",
    "mumbai central (local)": "Mumbai Central",
}

for alias, canonical in LOCATION_ALIASES.items():
    LOCATION_LOOKUP[alias.lower()] = canonical


def normalize_location(value: str) -> str | None:
    """
    Normalizes a location string to its canonical Western Line station name.
    Returns None if the location is not a supported Western Line station.
    """
    if not value or not isinstance(value, str):
        return None
    cleaned = value.strip().lower()
    return LOCATION_LOOKUP.get(cleaned)


def is_valid_location(value: str) -> bool:
    """
    Returns True if the location can be resolved to a supported Western Line station.
    """
    return normalize_location(value) is not None
