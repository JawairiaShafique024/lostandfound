"""
Item Category Classification for Better Matching
"""

# Define item categories with keywords
ITEM_CATEGORIES = {
    'phone': {
        'keywords': ['phone', 'mobile', 'smartphone', 'iphone', 'android', 'samsung', 'huawei', 'xiaomi', 'oppo', 'vivo', 'realme', 'oneplus', 'nokia', 'infinix', 'tecno'],
        'brands': ['apple', 'samsung', 'huawei', 'xiaomi', 'oppo', 'vivo', 'realme', 'oneplus', 'nokia', 'infinix', 'tecno', 'motorola', 'lg', 'sony']
    },
    'bag': {
        'keywords': ['bag', 'backpack', 'purse', 'handbag', 'satchel', 'briefcase', 'tote', 'clutch', 'wallet', 'pouch'],
        'brands': ['nike', 'adidas', 'puma', 'gucci', 'prada', 'louis vuitton', 'coach', 'michael kors']
    },
    'watch': {
        'keywords': ['watch', 'timepiece', 'smartwatch', 'wristwatch', 'clock'],
        'brands': ['rolex', 'omega', 'casio', 'seiko', 'apple watch', 'samsung watch', 'fitbit', 'garmin', 'fossil']
    },
    'jewelry': {
        'keywords': ['ring', 'necklace', 'bracelet', 'earring', 'pendant', 'chain', 'jewelry', 'jewellery'],
        'brands': ['tiffany', 'cartier', 'pandora', 'swarovski']
    },
    'keys': {
        'keywords': ['key', 'keys', 'keychain', 'car key', 'house key', 'remote'],
        'brands': ['toyota', 'honda', 'suzuki', 'hyundai', 'kia', 'nissan', 'mazda']
    },
    'electronics': {
        'keywords': ['laptop', 'tablet', 'headphones', 'earbuds', 'charger', 'cable', 'adapter', 'powerbank', 'speaker'],
        'brands': ['apple', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'sony', 'bose', 'jbl']
    },
    'clothing': {
        'keywords': ['shirt', 'jacket', 'coat', 'sweater', 'hoodie', 'pants', 'jeans', 'dress', 'skirt', 'shoes', 'sneakers'],
        'brands': ['nike', 'adidas', 'zara', 'h&m', 'uniqlo', 'gap', 'levis']
    },
    'documents': {
        'keywords': ['id', 'passport', 'license', 'card', 'certificate', 'document', 'paper', 'cnic', 'driving license'],
        'brands': []
    },
    'other': {
        'keywords': ['item', 'thing', 'object', 'stuff'],
        'brands': []
    }
}

def classify_item(item_name, description=""):
    """
    Classify an item into a category based on name and description
    """
    text = f"{item_name} {description}".lower()
    
    # Score each category
    category_scores = {}
    
    for category, data in ITEM_CATEGORIES.items():
        score = 0
        
        # Check keywords
        for keyword in data['keywords']:
            if keyword.lower() in text:
                score += 2  # Higher weight for keywords
        
        # Check brands
        for brand in data['brands']:
            if brand.lower() in text:
                score += 1  # Lower weight for brands
        
        category_scores[category] = score
    
    # Return category with highest score
    if max(category_scores.values()) > 0:
        return max(category_scores, key=category_scores.get)
    else:
        return 'other'

def are_items_compatible(lost_item, found_item):
    """
    Check if two items are in compatible categories for matching
    """
    lost_category = classify_item(lost_item.item_name, lost_item.description or "")
    found_category = classify_item(found_item.item_name, found_item.description or "")
    
    # Same category is always compatible
    if lost_category == found_category:
        return True, 1.0, lost_category, found_category
    
    # Define compatible categories
    compatible_categories = {
        'phone': ['electronics'],  # Phone can match with electronics
        'electronics': ['phone'],  # Electronics can match with phone
        'bag': ['clothing'],       # Bag can match with clothing accessories
        'clothing': ['bag'],       # Clothing can match with bags
        'jewelry': ['watch'],      # Jewelry can match with watches
        'watch': ['jewelry'],      # Watches can match with jewelry
    }
    
    # Check if categories are compatible
    if lost_category in compatible_categories:
        if found_category in compatible_categories[lost_category]:
            return True, 0.7, lost_category, found_category  # Lower compatibility score
    
    # Special case: 'other' category can match with anything but with low score
    if lost_category == 'other' or found_category == 'other':
        return True, 0.3, lost_category, found_category
    
    # Not compatible
    return False, 0.0, lost_category, found_category

def get_item_category_info(item_name, description=""):
    """
    Get detailed category information for an item
    """
    category = classify_item(item_name, description)
    return {
        'category': category,
        'keywords': ITEM_CATEGORIES[category]['keywords'],
        'brands': ITEM_CATEGORIES[category]['brands']
    }
