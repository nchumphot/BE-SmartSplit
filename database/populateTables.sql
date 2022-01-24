-- Add some dummy users
INSERT INTO users (name, email)
VALUES ('Spencer', 'spencer99@gmail.com'), ('Elizabeth', 'queen.e@buckingham.com'),
('Rubella', 'rubella123@hotmail.com'), ('Leslie', 'k.leslie@parksandrec.com'),
('Ross', 'we.were.on.a.break@gmail.com');

-- Add some dummy expenses
INSERT INTO expenses (user_id, description, total_balance)
VALUES (1, 'Spaghetti House', 75.60), (5, 'Birthday cake for Rubella', 50.00);

-- Add some dummy transations
INSERT INTO transactions (expense_id, lender_id, borrower_id, balance)
VALUES (1, 1, 1, 25.20), (1, 1, 2, 25.20), (1, 1, 3, 25.20),
(2, 5, 1, 12.50), (2, 5, 2, 12.50), (2, 5, 4, 12.50), (2, 5, 5, 12.50);

-- Add to the contact list
INSERT INTO contact_list (list_owner_id, contact_id)
VALUES (1, 2), (1, 3), (1, 4), (1, 5), (2, 1), (2, 3), (2, 4), (2, 5),
(3, 1), (3, 2), (3, 4), (3, 5), (4, 1), (4, 2), (4, 3), (4, 5),
(5, 1), (5, 2), (5, 3), (5, 4);

-- Add some dummy comments
INSERT INTO comments (expense_id, user_id, comment)
VALUES (1, 1, 'Great dinner! Hope to see you guys again soon.'),
(1, 2, 'Thanks everyone for coming.'), (1, 3, 'Had such a great time!');