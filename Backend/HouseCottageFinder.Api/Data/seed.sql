USE housecottagefinder;

CREATE TABLE IF NOT EXISTS Properties (
    Id INT NOT NULL AUTO_INCREMENT,
    Title VARCHAR(200) NOT NULL,
    Address VARCHAR(255) NOT NULL,
    City VARCHAR(100) NOT NULL,
    DealType VARCHAR(50) NOT NULL,
    Price DECIMAL(12,2) NOT NULL,
    Bedrooms INT NOT NULL,
    Bathrooms INT NOT NULL,
    Area INT NOT NULL,
    Latitude DOUBLE NOT NULL,
    Longitude DOUBLE NOT NULL,
    Description VARCHAR(1000) NULL,
    ImageUrl VARCHAR(500) NULL,
    CreatedAt DATETIME(6) NOT NULL,
    PRIMARY KEY (Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO Properties
    (Title, Address, City, DealType, Price, Bedrooms, Bathrooms, Area, Latitude, Longitude, Description, ImageUrl, CreatedAt)
VALUES
    ('Modern City Apartment', 'Knez Mihailova 12', 'Belgrade', 'For rent', 950, 2, 1, 62, 44.8176, 20.4569, 'Bright apartment in the heart of the city, close to all amenities.', 'house.jpg', NOW()),
    ('Cozy Suburban House', 'Bulevar Kralja Aleksandra 85', 'Belgrade', 'For sale', 185000, 4, 2, 140, 44.8022, 20.4774, 'Family home with a big yard and garage, quiet neighborhood.', 'house.jpg', NOW()),
    ('Seaside Cottage', 'Obala 3', 'Budva', 'For rent', 750, 2, 1, 55, 42.2881, 18.8426, 'Charming cottage with a sea view, perfect for a summer getaway.', 'house.jpg', NOW()),
    ('Suburban Villa', 'Ulica 8', 'Novi Sad', 'For sale', 320000, 5, 3, 210, 45.2671, 19.8335, 'Spacious villa with pool, garden and a modern interior.', 'house.jpg', NOW()),
    ('Studio Apartment', 'Kralja Petra 5', 'Belgrade', 'For rent', 420, 1, 1, 32, 44.8206, 20.4489, 'Compact studio, fully furnished, walking distance to downtown.', 'house.jpg', NOW()),
    ('Family Townhouse', 'Nemanjina 22', 'Niš', 'For sale', 145000, 3, 2, 110, 43.3209, 21.8952, 'Renovated townhouse with balcony and parking spot.', 'house.jpg', NOW()),
    ('Mountain Retreat', 'Planinski put 7', 'Zlatibor', 'For rent', 600, 3, 2, 95, 43.7284, 19.7016, 'Cozy retreat with fireplace, near the ski slopes.', 'house.jpg', NOW()),
    ('Designer Loft', 'Skadarska 14', 'Belgrade', 'For sale', 265000, 2, 2, 130, 44.8162, 20.4630, 'Industrial style loft with high ceilings and exposed brick.', 'house.jpg', NOW());