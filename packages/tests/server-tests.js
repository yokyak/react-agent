const { agentServer } = require('../react-agent-server');
const { Agent, get, set, getStore } = require('../react-agent');

const express = require('express');
const pg = require('pg');
const chai = require('chai');

const app = express();
const server = app.listen(3000, () => console.log('Server Connected'));
const should = chai.should();


const uri = 'postgres://nupdilwa:wKwvHTFrRlqfKgJAQ5088RaCIhDJLHz5@nutty-custard-apple.db.elephantsql.com:5432/nupdilwa';

const client = new pg.Client(uri);
client.connect();

describe('React Agent Server', () => {
  const db = {
    name: 'nupdilwa',
    user: 'nupdilwa',
    password: 'wKwvHTFrRlqfKgJAQ5088RaCIhDJLHz5',
    dialect: 'postgres',
    host: 'nutty-custard-apple.db.elephantsql.com',
    port: 5432,
  };

  let queries;


  before(() => {

      client.query(`CREATE TABLE classes(
        name VARCHAR(100),
        department VARCHAR(100),
        id SERIAL PRIMARY KEY
        )`);

      client.query(`CREATE TABLE students(
      name VARCHAR(255),
      major VARCHAR(255),
      classyr INTEGER,
      id SERIAL PRIMARY KEY
      )`);

      client.query(`CREATE TABLE classes_students(
        class_id SERIAL,
        student_id SERIAL,
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
      )`);

      client.query(`INSERT INTO classes(name, department) VALUES
      ('Intro to Sociology', 'Sociology'),
      ('Examining Gender in the 21st C.', 'Gender Studies'),
      ('Algorithms', 'Computer Science'),
      ('Contemporary Art', 'Art History'),
      ('Formal Language and State Automata', 'Computer Science'),
      ('Social Theory', 'Sociology'),
      ('Graph Theory', 'Mathematics'),
      ('Jewish, Christian, and Islamic Investigations', 'Religion'),
      ('Property Law', 'Legal Studies'),
      ('Intro to Algebra', 'Mathematics'),
      ('Intellectual Property Law', 'Legal Studies'),
      ('Privacy and Hacking', 'Digital Humanities'),
      ('Advanced Terrorism', 'International Relations')`);

      client.query(`INSERT INTO students(name, major, classyr) VALUES
      ('Tom', 'Art History', 2016),
      ('Henry', 'Computer Science', 2016),
      ('Tiffany', 'Computer Science', 2008),
      ('Andrew', 'International Relations', 2019),
      ('Eric', 'Legal Studies', 2010),
      ('Althea', 'Religion', 2016),
      ('Monica', 'Art History', 2010),
      ('Mike', 'Sociology', 2010),
      ('Peter', 'Digital Humanities', 2017),
      ('Justin', 'Mathematics', 2017),
      ('Jaimie', 'International Relations', 2006),
      ('Annie', 'Computer Science', 2019),
      ('Dale', 'Computer Science', 2005),
      ('Erik', 'Gender Studies', 2011)`);

      client.query(`INSERT INTO classes_students(class_id, student_id) VALUES
      (1, 13),
      (3, 11),
      (1, 6),
      (5, 8),
      (6, 4),
      (3, 9),
      (4, 5),
      (10, 7),
      (9, 11),
      (6, 3),
      (2, 10),
      (11, 4),
      (5, 1),
      (6, 7),
      (8, 8),
      (7, 3),
      (6, 6)`);

  });

  after(() => {

    client.query('DROP TABLE classes, students, classes_students');

  });

  describe('pre', () => {
    it('should return error if a function returns false', (done) => {
      queries = {
        pre: (request) => { return request.cookie === 'testCookie' },
        getStudentClasses: `SELECT s.name, c.name FROM students s INNER JOIN classes_students cs on s.id = cs.student_id INNER JOIN classes c on c.id = cs.class_id`
      }
      agentServer(server, db, queries);
    });

    it('should return error if one out of multiple functions returns false', (done) => {
      queries = {
        getStudentClasses: {
          pre: [(request) => { return request.cookie === 'testCookie'}, (request) => { return request.id === 'testID' }],
          query: `SELECT s.name, c.name FROM students s INNER JOIN classes_students cs on s.id = cs.student_id INNER JOIN classes c on c.id = cs.class_id`
        }
      };
      agentServer(server, db, queries);
    });

    it('should return true if one function returns true', (done) => {

    });

    it('should return true if all functions return true', (done) => {

    });
  });

  describe('query', () => {
    it('should execute SQL command with ? replacement', (done) => {


      queries = {
        addStudent: {
          query: `INSERT INTO students VALUES(?, ?)`
        }
      };
      agentServer(server, db, queries);


    });
  });

  describe('set', () => {
    it('should return updated values to subscribed keys', (done) => {

      queries = {
        getStudentClasses: {
          query: `SELECT s.name, c.name FROM students s INNER JOIN classes_students cs on s.id = cs.student_id INNER JOIN classes c on c.id = cs.class_id`
        }
      };
      agentServer(server, db, queries);
    });
  });

  describe('callback', () => {
    it('if query exists, it should execute with response from query', (done) => {

    });

    it('if query exists, it should send response to client', (done) => {

    });

    it('if query does not exist and working, it should resolve and send back to client', (done) => {

    });

    it('if query does not exist and error, it should reject and send back to client', (done) => {

    });
  });

  describe('errorMessage', () => {

    it('should send default error to client', (done) => {
      queries = {
        addStudent: {
          query: `INSERT INTO studens VALUES(?, ?)`
        }
      };
      agentServer(server, db, queries);
    });

    it('should overwrite default error message', (done) => {
      queries = {
        addStudent: {
          query: `INSERT INTO studens VALUES(?, ?)`,
          error: `Student entry error for query 'addStudent'`
        }
      };
      agentServer(server, db, queries);
    });
  });
});

