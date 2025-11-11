-- Seed Data for Questions Table
-- Diverse trivia questions across all categories and difficulty levels

-- GENERAL KNOWLEDGE - Easy
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('What is the capital of France?', 'general', 'easy', '["London", "Berlin", "Paris", "Madrid"]', 2, 'Paris has been the capital of France since 508 AD.'),
('How many continents are there?', 'general', 'easy', '["5", "6", "7", "8"]', 2, 'The seven continents are: Africa, Antarctica, Asia, Australia, Europe, North America, and South America.'),
('What color is a ruby?', 'general', 'easy', '["Blue", "Green", "Red", "Yellow"]', 2, 'Rubies are red gemstones, a variety of the mineral corundum.'),
('How many days are in a leap year?', 'general', 'easy', '["364", "365", "366", "367"]', 2, 'A leap year has 366 days, with February having 29 days instead of 28.'),
('What is the largest ocean on Earth?', 'general', 'easy', '["Atlantic", "Indian", "Pacific", "Arctic"]', 2, 'The Pacific Ocean covers about 46% of Earth''s water surface.');

-- GENERAL KNOWLEDGE - Medium
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('In what year did World War II end?', 'general', 'medium', '["1943", "1944", "1945", "1946"]', 2, 'World War II ended in 1945 with Germany surrendering in May and Japan in September.'),
('What is the smallest country in the world?', 'general', 'medium', '["Monaco", "Vatican City", "San Marino", "Liechtenstein"]', 1, 'Vatican City is the smallest country, covering just 0.44 square kilometers.'),
('How many bones are in the adult human body?', 'general', 'medium', '["186", "206", "226", "246"]', 1, 'The adult human skeleton has 206 bones.'),
('What is the currency of Japan?', 'general', 'medium', '["Won", "Yen", "Yuan", "Ringgit"]', 1, 'The Japanese currency is the Yen (¥).'),
('Which planet is known as the Red Planet?', 'general', 'medium', '["Venus", "Mars", "Jupiter", "Saturn"]', 1, 'Mars appears red due to iron oxide (rust) on its surface.');

-- SCIENCE - Easy
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('What gas do plants absorb from the atmosphere?', 'science', 'easy', '["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"]', 1, 'Plants absorb CO₂ during photosynthesis to produce glucose and oxygen.'),
('What is H2O commonly known as?', 'science', 'easy', '["Salt", "Water", "Sugar", "Air"]', 1, 'H₂O is the chemical formula for water.'),
('How many legs does a spider have?', 'science', 'easy', '["6", "8", "10", "12"]', 1, 'Spiders are arachnids and have 8 legs.'),
('What is the center of an atom called?', 'science', 'easy', '["Electron", "Nucleus", "Proton", "Neutron"]', 1, 'The nucleus is at the center of an atom, containing protons and neutrons.'),
('What force pulls objects toward Earth?', 'science', 'easy', '["Magnetism", "Gravity", "Friction", "Inertia"]', 1, 'Gravity is the force that attracts objects toward the center of the Earth.');

-- SCIENCE - Medium
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('What is the speed of light?', 'science', 'medium', '["299,792 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"]', 0, 'Light travels at approximately 299,792 kilometers per second in a vacuum.'),
('What element has the atomic number 1?', 'science', 'medium', '["Helium", "Hydrogen", "Oxygen", "Carbon"]', 1, 'Hydrogen is the first element on the periodic table with atomic number 1.'),
('What is the largest organ in the human body?', 'science', 'medium', '["Heart", "Brain", "Skin", "Liver"]', 2, 'The skin is the largest organ, covering about 2 square meters in adults.'),
('What type of animal is a Komodo dragon?', 'science', 'medium', '["Snake", "Lizard", "Crocodile", "Turtle"]', 1, 'The Komodo dragon is the world''s largest living lizard species.'),
('What is the chemical symbol for gold?', 'science', 'medium', '["Go", "Au", "Gd", "Gl"]', 1, 'Gold''s chemical symbol Au comes from the Latin word "aurum".');

-- HISTORY - Easy
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('Who was the first President of the United States?', 'history', 'easy', '["Thomas Jefferson", "George Washington", "Abraham Lincoln", "John Adams"]', 1, 'George Washington served as the first U.S. President from 1789-1797.'),
('In which year did the Titanic sink?', 'history', 'easy', '["1910", "1912", "1914", "1916"]', 1, 'The RMS Titanic sank on April 15, 1912 after hitting an iceberg.'),
('Which ancient wonder is still standing?', 'history', 'easy', '["Colossus of Rhodes", "Great Pyramid of Giza", "Hanging Gardens", "Lighthouse of Alexandria"]', 1, 'The Great Pyramid of Giza is the only ancient wonder still largely intact.'),
('What year did humans first land on the moon?', 'history', 'easy', '["1965", "1967", "1969", "1971"]', 2, 'Apollo 11 landed on the moon on July 20, 1969.'),
('Who painted the Mona Lisa?', 'history', 'easy', '["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"]', 1, 'Leonardo da Vinci painted the Mona Lisa between 1503-1519.');

-- HISTORY - Hard
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('What year did the Berlin Wall fall?', 'history', 'hard', '["1987", "1988", "1989", "1990"]', 2, 'The Berlin Wall fell on November 9, 1989, marking the end of Cold War divisions.'),
('Who was the longest-reigning British monarch before Elizabeth II?', 'history', 'hard', '["Victoria", "George III", "Edward VII", "George V"]', 0, 'Queen Victoria reigned for 63 years (1837-1901) before being surpassed by Elizabeth II.'),
('In what year did the Roman Empire fall?', 'history', 'hard', '["410 AD", "455 AD", "476 AD", "500 AD"]', 2, 'The Western Roman Empire fell in 476 AD when Romulus Augustulus was deposed.'),
('Who wrote "The Art of War"?', 'history', 'hard', '["Confucius", "Sun Tzu", "Lao Tzu", "Mencius"]', 1, 'Sun Tzu, a Chinese military strategist, wrote "The Art of War" around the 5th century BC.'),
('What was the name of the first successful English colony in America?', 'history', 'hard', '["Plymouth", "Jamestown", "Roanoke", "Boston"]', 1, 'Jamestown, Virginia was founded in 1607 and was the first permanent English settlement.');

-- GEOGRAPHY - Easy
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('What is the capital of Australia?', 'geography', 'easy', '["Sydney", "Canberra", "Melbourne", "Brisbane"]', 1, 'Canberra is Australia''s capital, chosen as a compromise between Sydney and Melbourne.'),
('Which is the longest river in the world?', 'geography', 'easy', '["Amazon", "Nile", "Yangtze", "Mississippi"]', 1, 'The Nile River is approximately 6,650 km long, making it the longest river.'),
('How many states are in the United States?', 'geography', 'easy', '["48", "49", "50", "51"]', 2, 'The United States has 50 states since Hawaii joined in 1959.'),
('What is the largest desert in the world?', 'geography', 'easy', '["Sahara", "Antarctic", "Arabian", "Gobi"]', 1, 'Antarctica is technically the largest desert (polar desert) at 14 million km².'),
('Mount Everest is located in which mountain range?', 'geography', 'easy', '["Alps", "Himalayas", "Andes", "Rockies"]', 1, 'Mount Everest, the world''s highest peak, is in the Himalayas on the Nepal-Tibet border.');

-- ENTERTAINMENT - Easy
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('Who played Iron Man in the Marvel Cinematic Universe?', 'entertainment', 'easy', '["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Mark Ruffalo"]', 1, 'Robert Downey Jr. portrayed Tony Stark/Iron Man from 2008-2019.'),
('What is the highest-grossing film of all time?', 'entertainment', 'easy', '["Titanic", "Avatar", "Avengers: Endgame", "Star Wars"]', 1, 'Avatar (2009) is the highest-grossing film with over $2.9 billion worldwide.'),
('How many Harry Potter books are there?', 'entertainment', 'easy', '["5", "6", "7", "8"]', 2, 'J.K. Rowling wrote seven Harry Potter novels from 1997-2007.'),
('Who sang "Thriller"?', 'entertainment', 'easy', '["Prince", "Michael Jackson", "Elvis Presley", "Whitney Houston"]', 1, 'Michael Jackson released "Thriller" in 1982, which became the best-selling album ever.'),
('What streaming service created "Stranger Things"?', 'entertainment', 'easy', '["Hulu", "Netflix", "Amazon Prime", "Disney+"]', 1, 'Netflix premiered Stranger Things in 2016.');

-- ENTERTAINMENT - Medium
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('Which band wrote "Bohemian Rhapsody"?', 'entertainment', 'medium', '["The Beatles", "Queen", "Led Zeppelin", "Pink Floyd"]', 1, 'Queen released "Bohemian Rhapsody" in 1975, written by Freddie Mercury.'),
('Who directed "The Godfather"?', 'entertainment', 'medium', '["Martin Scorsese", "Francis Ford Coppola", "Steven Spielberg", "Stanley Kubrick"]', 1, 'Francis Ford Coppola directed The Godfather (1972) and its sequels.'),
('How many seasons of "Breaking Bad" are there?', 'entertainment', 'medium', '["4", "5", "6", "7"]', 1, 'Breaking Bad ran for 5 seasons from 2008-2013.'),
('What year was the first iPhone released?', 'entertainment', 'medium', '["2005", "2007", "2009", "2011"]', 1, 'Apple released the first iPhone on June 29, 2007.'),
('Who wrote the "Lord of the Rings" trilogy?', 'entertainment', 'medium', '["C.S. Lewis", "J.R.R. Tolkien", "George R.R. Martin", "J.K. Rowling"]', 1, 'J.R.R. Tolkien wrote The Lord of the Rings, published 1954-1955.');

-- SPORTS - Easy
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('How many players are on a soccer team?', 'sports', 'easy', '["9", "10", "11", "12"]', 2, 'A soccer team has 11 players on the field including the goalkeeper.'),
('What sport is played at Wimbledon?', 'sports', 'easy', '["Golf", "Tennis", "Cricket", "Badminton"]', 1, 'Wimbledon is the oldest tennis tournament, held annually in London since 1877.'),
('How many points is a touchdown worth in American football?', 'sports', 'easy', '["3", "5", "6", "7"]', 2, 'A touchdown is worth 6 points, with the option for a 1 or 2 point conversion.'),
('What color is the center of an archery target?', 'sports', 'easy', '["Red", "Yellow", "Blue", "Green"]', 1, 'The center bullseye of an archery target is yellow and worth the most points.'),
('In basketball, how many points is a free throw worth?', 'sports', 'easy', '["1", "2", "3", "4"]', 0, 'A free throw is worth 1 point in basketball.');

-- SPORTS - Medium
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('Who has won the most Olympic gold medals?', 'sports', 'medium', '["Usain Bolt", "Michael Phelps", "Simone Biles", "Carl Lewis"]', 1, 'Michael Phelps won 23 Olympic gold medals in swimming.'),
('What country won the 2018 FIFA World Cup?', 'sports', 'medium', '["Germany", "France", "Brazil", "Argentina"]', 1, 'France defeated Croatia 4-2 in the 2018 World Cup final.'),
('How long is a marathon?', 'sports', 'medium', '["26.2 miles", "24.5 miles", "28 miles", "30 miles"]', 0, 'A marathon is 26.2 miles or 42.195 kilometers.'),
('What is the only sport to be played on the moon?', 'sports', 'medium', '["Baseball", "Golf", "Frisbee", "Soccer"]', 1, 'Alan Shepard hit golf balls on the moon during the Apollo 14 mission in 1971.'),
('In tennis, what is a score of zero called?', 'sports', 'medium', '["Null", "Love", "Zero", "Naught"]', 1, 'A score of zero in tennis is called "love", possibly from French "l''oeuf" (egg).');

-- ARTS - Easy  
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('Who painted "Starry Night"?', 'arts', 'easy', '["Pablo Picasso", "Vincent van Gogh", "Claude Monet", "Salvador Dali"]', 1, 'Vincent van Gogh painted The Starry Night in 1889 while in an asylum in France.'),
('What primary colors mix to make green?', 'arts', 'easy', '["Red and Blue", "Blue and Yellow", "Red and Yellow", "Blue and White"]', 1, 'Blue and yellow are primary colors that combine to create green.'),
('Who sculpted the statue of David?', 'arts', 'easy', '["Donatello", "Michelangelo", "Bernini", "Rodin"]', 1, 'Michelangelo carved the marble statue of David between 1501-1504.'),
('What instrument has 88 keys?', 'arts', 'easy', '["Organ", "Piano", "Harpsichord", "Accordion"]', 1, 'A standard piano has 88 keys - 52 white and 36 black.'),
('Who wrote "Romeo and Juliet"?', 'arts', 'easy', '["Charles Dickens", "William Shakespeare", "Jane Austen", "Oscar Wilde"]', 1, 'William Shakespeare wrote Romeo and Juliet around 1594-1596.');

-- TECHNOLOGY - Easy
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('What does "WWW" stand for?', 'technology', 'easy', '["Wide Web World", "World Wide Web", "Web World Wide", "World Web Wide"]', 1, 'WWW stands for World Wide Web, invented by Tim Berners-Lee in 1989.'),
('What company makes the iPhone?', 'technology', 'easy', '["Samsung", "Apple", "Google", "Microsoft"]', 1, 'Apple Inc. designs and manufactures the iPhone.'),
('What does "AI" stand for?', 'technology', 'easy', '["Automated Intelligence", "Artificial Intelligence", "Advanced Intelligence", "Algorithmic Intelligence"]', 1, 'AI stands for Artificial Intelligence.'),
('What is the main language used to create websites?', 'technology', 'easy', '["Python", "HTML", "Java", "C++"]', 1, 'HTML (HyperText Markup Language) is the standard language for creating web pages.'),
('Who founded Microsoft?', 'technology', 'easy', '["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Elon Musk"]', 1, 'Bill Gates co-founded Microsoft with Paul Allen in 1975.');

-- TECHNOLOGY - Medium
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation) VALUES
('What year was Facebook founded?', 'technology', 'medium', '["2002", "2004", "2006", "2008"]', 1, 'Mark Zuckerberg launched Facebook on February 4, 2004 from his Harvard dorm room.'),
('What does "CPU" stand for?', 'technology', 'medium', '["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Computer Processing Unit"]', 0, 'CPU stands for Central Processing Unit, the brain of a computer.'),
('What is the most popular programming language in 2023?', 'technology', 'medium', '["Java", "Python", "JavaScript", "C++"]', 1, 'Python is widely considered the most popular programming language due to its versatility.'),
('What does "USB" stand for?', 'technology', 'medium', '["Universal Serial Bus", "United Serial Bus", "Universal System Bus", "Uniform Serial Bus"]', 0, 'USB stands for Universal Serial Bus, a standard for connecting devices.'),
('Who is the CEO of Tesla?', 'technology', 'medium', '["Jeff Bezos", "Elon Musk", "Tim Cook", "Sundar Pichai"]', 1, 'Elon Musk has been CEO of Tesla since 2008.');
