// Public birthdates of well-known people, plus name lists for Search categories.

export const PEOPLE = [
  ['Albert Einstein', '1879-03-14', 'Physicist'], ['Marie Curie', '1867-11-07', 'Scientist'],
  ['Martin Luther King Jr.', '1929-01-15', 'Civil rights leader'], ['Nelson Mandela', '1918-07-18', 'Statesman'],
  ['Frida Kahlo', '1907-07-06', 'Painter'], ['Oprah Winfrey', '1954-01-29', 'Media'],
  ['Barack Obama', '1961-08-04', 'U.S. President'], ['Michelle Obama', '1964-01-17', 'Author'],
  ['Beyoncé', '1981-09-04', 'Singer'], ['Rihanna', '1988-02-20', 'Singer & founder'],
  ['Taylor Swift', '1989-12-13', 'Singer-songwriter'], ['Serena Williams', '1981-09-26', 'Tennis'],
  ['Michael Jordan', '1963-02-17', 'Basketball'], ['LeBron James', '1984-12-30', 'Basketball'],
  ['Cristiano Ronaldo', '1985-02-05', 'Football'], ['Lionel Messi', '1987-06-24', 'Football'],
  ['Usain Bolt', '1986-08-21', 'Sprinter'], ['Muhammad Ali', '1942-01-17', 'Boxer'],
  ['Steve Jobs', '1955-02-24', 'Apple co-founder'], ['Bill Gates', '1955-10-28', 'Microsoft co-founder'],
  ['Elon Musk', '1971-06-28', 'Entrepreneur'], ['Mark Zuckerberg', '1984-05-14', 'Entrepreneur'],
  ['Prince', '1958-06-07', 'Musician'], ['Michael Jackson', '1958-08-29', 'Singer'],
  ['Bob Marley', '1945-02-06', 'Musician'], ['Whitney Houston', '1963-08-09', 'Singer'],
  ['Madonna', '1958-08-16', 'Singer'], ['Lady Gaga', '1986-03-28', 'Singer'],
  ['Drake', '1986-10-24', 'Rapper'], ['Kendrick Lamar', '1987-06-17', 'Rapper'],
  ['Rosa Parks', '1913-02-04', 'Activist'], ['Malcolm X', '1925-05-19', 'Activist'],
  ['Maya Angelou', '1928-04-04', 'Poet'], ['Toni Morrison', '1931-02-18', 'Novelist'],
  ['Mahatma Gandhi', '1869-10-02', 'Leader'], ['Abraham Lincoln', '1809-02-12', 'U.S. President'],
  ['Theodore Roosevelt', '1858-10-27', 'U.S. President'], ['Sylvia Plath', '1932-10-27', 'Poet'],
  ['John Cleese', '1939-10-27', 'Comedian'], ['Julia Roberts', '1967-10-28', 'Actor'],
  ['Frank Ocean', '1987-10-28', 'Singer'], ['Hillary Clinton', '1947-10-26', 'Politician'],
  ['Pablo Picasso', '1881-10-25', 'Painter'], ['Pelé', '1940-10-23', 'Football'],
  ['Diego Maradona', '1960-10-30', 'Football'], ['John Lennon', '1940-10-09', 'Musician'],
  ['Vincent van Gogh', '1853-03-30', 'Painter'], ['Zendaya', '1996-09-01', 'Actor'],
  ['Denzel Washington', '1954-12-28', 'Actor'], ['Will Smith', '1968-09-25', 'Actor'],
  ['Meryl Streep', '1949-06-22', 'Actor'], ['Tom Hanks', '1956-07-09', 'Actor'],
  ['Leonardo DiCaprio', '1974-11-11', 'Actor'], ['Keanu Reeves', '1964-09-02', 'Actor'],
  ['Jackie Chan', '1954-04-07', 'Actor'], ['Bruce Lee', '1940-11-27', 'Martial artist'],
  ['Jimi Hendrix', '1942-11-27', 'Guitarist'], ['Audrey Hepburn', '1929-05-04', 'Actor'],
  ['Marilyn Monroe', '1926-06-01', 'Actor'], ['Stephen Hawking', '1942-01-08', 'Physicist'],
  ['Nikola Tesla', '1856-07-10', 'Inventor'], ['Ada Lovelace', '1815-12-10', 'Mathematician'],
  ['Walt Disney', '1901-12-05', 'Animator'], ['Coco Chanel', '1883-08-19', 'Designer'],
  ['Kobe Bryant', '1978-08-23', 'Basketball'], ['Tiger Woods', '1975-12-30', 'Golf'],
  ['Simone Biles', '1997-03-14', 'Gymnast'], ['Naomi Osaka', '1997-10-16', 'Tennis'],
  ['Dwayne Johnson', '1972-05-02', 'Actor'], ['Kim Kardashian', '1980-10-21', 'Media'],
].map(([name, date, role]) => ({ name, date, role }));

export const CATEGORIES = [
  { id: 'locations', label: 'Locations', icon: 'pin', items: ['Paris', 'Tokyo', 'New York', 'London', 'Dubai', 'Lagos', 'Dakar', 'Conakry', 'Abidjan', 'Bamako', 'Accra', 'Nairobi', 'Marrakech', 'Cairo', 'Cape Town', 'Toronto', 'Montreal', 'Barcelona', 'Lisbon', 'Rome', 'Berlin', 'Amsterdam', 'Istanbul', 'Seoul', 'Bangkok', 'Singapore', 'Sydney', 'Rio de Janeiro', 'Mexico City', 'Los Angeles', 'Miami', 'Atlanta'] },
  { id: 'people', label: 'People', icon: 'user' },
  { id: 'clothing', label: 'Clothing', icon: 'shirt', items: ['Nike', 'Adidas', 'Puma', 'Zara', 'Gucci', 'Prada', 'Louis Vuitton', 'Chanel', 'Levis', 'Uniqlo', 'H&M', 'Ralph Lauren', 'Balenciaga', 'Patagonia', 'Lululemon', 'Versace'] },
  { id: 'cars', label: 'Cars', icon: 'car', items: ['Toyota', 'Honda', 'BMW', 'Mercedes', 'Audi', 'Tesla', 'Porsche', 'Ferrari', 'Lamborghini', 'Ford', 'Chevrolet', 'Lexus', 'Volvo', 'Jeep', 'Range Rover', 'Mazda', 'Subaru', 'Hyundai', 'Kia', 'Nissan', 'Volkswagen'] },
  { id: 'banks', label: 'Banks', icon: 'bank', items: ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'HSBC', 'Barclays', 'TD Bank', 'RBC', 'Scotiabank', 'Capital One', 'BNP Paribas', 'Santander', 'Goldman Sachs', 'Ally', 'Ecobank'] },
  { id: 'history', label: 'History', icon: 'book' },
  { id: 'shopping', label: 'Shopping', icon: 'bag', items: ['Amazon', 'Target', 'Walmart', 'Costco', 'IKEA', 'Sephora', 'Apple', 'Best Buy', 'Etsy', 'eBay', 'Nordstrom', 'Zalando'] },
  { id: 'travel', label: 'Travel', icon: 'plane', items: ['Emirates', 'Delta', 'Air France', 'Qatar Airways', 'Lufthansa', 'Air Canada', 'United', 'KLM', 'Turkish Airlines', 'Ethiopian Airlines', 'Royal Air Maroc', 'Singapore Airlines'] },
  { id: 'dining', label: 'Dining', icon: 'utensils', items: ['Italian', 'Japanese', 'Mexican', 'Thai', 'Indian', 'French', 'Ethiopian', 'Senegalese', 'Lebanese', 'Korean', 'Greek', 'Chinese', 'Vietnamese', 'Moroccan', 'Brazilian', 'Caribbean'] },
  { id: 'sports', label: 'Sports', icon: 'trophy', items: ['Soccer', 'Basketball', 'Tennis', 'Swimming', 'Running', 'Yoga', 'Boxing', 'Golf', 'Cycling', 'Volleyball', 'Baseball', 'Martial Arts', 'Climbing', 'Skiing', 'Pilates'] },
  { id: 'hobbies', label: 'Hobbies', icon: 'palette', items: ['Painting', 'Writing', 'Photography', 'Gardening', 'Cooking', 'Chess', 'Music', 'Dancing', 'Reading', 'Hiking', 'Meditation', 'Gaming', 'Knitting', 'Podcasting', 'Pottery'] },
];

// Two-tone gradients for result cards (no external images needed).
export const GRADIENTS = [
  ['#ff7a59', '#7b2ff7'], ['#00c9a7', '#1e3c72'], ['#f7971e', '#ffd200'], ['#ee0979', '#ff6a00'],
  ['#8e2de2', '#4a00e0'], ['#11998e', '#38ef7d'], ['#fc466b', '#3f5efb'], ['#f953c6', '#b91d73'],
];
