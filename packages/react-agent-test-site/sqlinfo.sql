CREATE TABLE users
(
  _id SERIAL PRIMARY KEY,
  username varchar(255),
  password varchar(255),
  email varchar(255),
  bio varchar(255),
  secretword varchar(255)
);

CREATE TABLE posts
(
  _id SERIAL PRIMARY KEY,
  chatmessage varchar(255),
  date timestamp default CURRENT_TIMESTAMP,
  user_id int references users(_id) ON DELETE CASCADE
);