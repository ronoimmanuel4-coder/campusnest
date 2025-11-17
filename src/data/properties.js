export const properties = [
  {
    id: 1,
    title: "Modern Studio Apartment",
    price: 15000,
    area: "Parklands",
    bedrooms: 1,
    bathrooms: 1,
    size: "25 sqm",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"
    ],
    description: "Cozy studio apartment perfect for students. Fully furnished with modern amenities including high-speed WiFi, study desk, and kitchenette.",
    amenities: ["WiFi", "Furnished", "Security", "Water", "Electricity Metered"],
    distanceFromCampus: "0.5 km",
    availableFrom: "Immediately",
    isPremium: false,
    exactLocation: "Parklands, 3rd Avenue, House No. 45B",
    caretakerPhone: "+254 712 345 678",
    caretakerName: "John Kamau",
    unlocked: false
  },
  {
    id: 2,
    title: "Spacious 2BR Apartment",
    price: 28000,
    area: "Ruaka",
    bedrooms: 2,
    bathrooms: 1,
    size: "65 sqm",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1502005097973-6a7082348e28?w=800",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800"
    ],
    description: "Beautiful 2-bedroom apartment ideal for sharing. Recently renovated with modern finishes. Close to shopping centers and public transport.",
    amenities: ["WiFi", "Parking", "Balcony", "Security", "Gym Access"],
    distanceFromCampus: "1.2 km",
    availableFrom: "Next Month",
    isPremium: true,
    exactLocation: "Ruaka, Limuru Road, Green Valley Apartments, Unit 12",
    caretakerPhone: "+254 723 456 789",
    caretakerName: "Mary Wanjiru",
    unlocked: false
  },
  {
    id: 3,
    title: "Budget Bedsitter",
    price: 8000,
    area: "Kasarani",
    bedrooms: 1,
    bathrooms: 1,
    size: "20 sqm",
    images: [
      "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800"
    ],
    description: "Affordable bedsitter perfect for budget-conscious students. Clean and well-maintained with basic amenities. Great neighborhood.",
    amenities: ["Water", "Security", "Electricity Metered"],
    distanceFromCampus: "2.0 km",
    availableFrom: "Immediately",
    isPremium: false,
    exactLocation: "Kasarani, Mwiki Road, Plot 234",
    caretakerPhone: "+254 734 567 890",
    caretakerName: "Peter Ochieng",
    unlocked: false
  },
  {
    id: 4,
    title: "Executive 1BR with Study",
    price: 22000,
    area: "Westlands",
    bedrooms: 1,
    bathrooms: 1,
    size: "45 sqm",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      "https://images.unsplash.com/photo-1560185007-cde436f6a4c0?w=800",
      "https://images.unsplash.com/photo-1558442074-3c19857bc1dc?w=800"
    ],
    description: "Premium one-bedroom apartment with dedicated study room. Perfect for serious students. High-end finishes and appliances.",
    amenities: ["WiFi", "Furnished", "Parking", "Gym", "Swimming Pool", "CCTV"],
    distanceFromCampus: "0.8 km",
    availableFrom: "Immediately",
    isPremium: true,
    exactLocation: "Westlands, School Lane, The Quarters, Apt 301",
    caretakerPhone: "+254 745 678 901",
    caretakerName: "Grace Njeri",
    unlocked: false
  },
  {
    id: 5,
    title: "Shared 3BR House",
    price: 12000,
    area: "Kileleshwa",
    bedrooms: 3,
    bathrooms: 2,
    size: "90 sqm",
    images: [
      "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800",
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"
    ],
    description: "One room available in a shared 3-bedroom house. Great for socializing with other students. Shared kitchen and living areas.",
    amenities: ["WiFi", "Garden", "Parking", "Laundry", "Security"],
    distanceFromCampus: "1.5 km",
    availableFrom: "Next Week",
    isPremium: false,
    exactLocation: "Kileleshwa, Githunguri Road, House 67",
    caretakerPhone: "+254 756 789 012",
    caretakerName: "David Mwangi",
    unlocked: false
  },
  {
    id: 6,
    title: "Luxury Penthouse Studio",
    price: 35000,
    area: "Kilimani",
    bedrooms: 1,
    bathrooms: 1,
    size: "55 sqm",
    images: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800",
      "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800"
    ],
    description: "Top-floor studio with panoramic city views. Ultra-modern with smart home features. Perfect for discerning students.",
    amenities: ["WiFi", "Furnished", "Parking", "Gym", "Rooftop Terrace", "Concierge"],
    distanceFromCampus: "1.0 km",
    availableFrom: "Next Month",
    isPremium: true,
    exactLocation: "Kilimani, Argwings Kodhek Road, Skyline Towers, PH2",
    caretakerPhone: "+254 767 890 123",
    caretakerName: "Sarah Mutua",
    unlocked: false
  }
];

export const getPropertyById = (id) => {
  return properties.find(p => p.id === parseInt(id));
};

export const unlockProperty = (id) => {
  const property = properties.find(p => p.id === parseInt(id));
  if (property) {
    property.unlocked = true;
  }
  return property;
};
