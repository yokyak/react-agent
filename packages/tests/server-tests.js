require('dotenv').config();
const { Agent } = require('../react-agent');
const { run } = require('../react-agent');
const { emit } = require('../react-agent');
const { on } = require('../react-agent');
const { subscribe } = require('../react-agent');
const React = require('../react-agent/node_modules/react');
const { render } = require('react-dom');
const agent = require('./../react-agent-server');
const express = require('express');
const pg = require('pg');
const chai = require('chai');
const jsdom = require('jsdom');
const fetch = require('request');

const { JSDOM } = jsdom;
const should = chai.should();
const app = express();

const uri = process.env.TESTSTR;

const client = new pg.Client(uri);
client.connect();

describe('React Agent Server', () => {
  const db = {
    name: process.env.TESTNAME,
    user: process.env.TESTUSER,
    password: process.env.TESTPASS,
    dialect: 'postgres',
    host: process.env.TESTURL,
    port: process.env.TESTPORT
  };
  
  const messages = [];

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

    const dom = new JSDOM('<!DOCTYPE html><div id=\'root\'></div>');

    render(
      <Agent testing={'http://localhost:3003'}>
        <div>
          React Agent
        </div>
      </Agent>
      , dom.window.document.querySelector('#root'),
    );

    const server = app.listen(3003);

    const actions = {
      getStudentClassesFail: {
        pre: request => false,
        action: 'SELECT s.name, c.name FROM students s INNER JOIN classes_students cs on s.id = cs.student_id INNER JOIN classes c on c.id = cs.class_id',
      },
      getStudentsFail: {
        pre: [
          (request) => {
            if (request.test === 'test') return request;
            return false;
          },
          () => false,
        ],
        action: 'SELECT s.name, c.name FROM students s INNER JOIN classes_students cs on s.id = cs.student_id INNER JOIN classes c on c.id = cs.class_id',
      },
      getStudentByID: {
        pre: [
          (request) => {
            if (request) return request;
            return false;
          },
          (request) => {
            if (request.id === 3) return request;
            return false;
          }],
        action: `SELECT name FROM students WHERE id = :id`,
        callback: response => {
          return response[0][0].name;
        }
      },
      getStudentsInTwoClasses: {
        action: 'SELECT s.name FROM students s INNER JOIN classes_students cs on s.id = cs.student_id INNER JOIN classes c on c.id = cs.class_id WHERE c.name = :class1 OR c.name = :class2',
        callback: response => {
          const names = {names: []};
          response[0].forEach(x => {
            names.names.push(x.name);
          })
          return names;
        }
      },
      getImage: {
          action: (resolve, reject, body) => {
          fetch(body.url, (error, response, body) => {
            if(error) reject(error);
            else resolve('success');
          })
        }
      },
      getStudents: {
        action: 'SELECT name FROM students',
        callback: response => {
          return response[0].map(x => {
            return x.name;
          })
        },
      },
      addClassDatabaseError: {
        action: `INSERT INTO studens VALUES(?, ?)`
      },
      actionFuncError: {
        action: (resolve, reject) => {
          reject();
        }
      },
      addClassNewError: {
        action: `INSERT INTO studens VALUES(?, ?)`,
        errorMessage: `Class entry error for action 'addClassNewError'`
      },
      fullLog: {
        pre: [
          (request) => {
            if (request) return request;
            return false;
          },
          (request) => {
            if (request.test === 'test') return request;
            return false;
          }],
        action: `SELECT * from classes`,
        callback: response => response[0],
      },
      preErrorSingleFunction: {
        pre: request => false,
        action: 'SELECT s.name, c.name FROM students s INNER JOIN classes_students cs on s.id = cs.student_id INNER JOIN classes c on c.id = cs.class_id',
      },
      preErrorMultipleFunctions: {
        pre: [
          (request) => {
            if (request) return request;
            return false;
          },
          (request) => {
            return false;
          }],
        action: 'SELECT s.name, c.name FROM students s INNER JOIN classes_students cs on s.id = cs.student_id INNER JOIN classes c on c.id = cs.class_id',
      },
      databaseError: {
        action: 'SELECT s.names, c.name FROM students s INNER JOIN classes_students cs on s.id = cs.student_id INNER JOIN classes c on c.id = cs.class_id',
      },
      actionFunctionError: {
        action: (resolve, reject) => {
          reject();
        }
      }
    };

    const loggingFunc = (message) => {
      // to help debug tests, uncomment console.log below
      // console.log(message);
      messages.push(message);
    };

    agent(server, actions, db, loggingFunc);
  });


  after(() => {
    client.query('DROP TABLE classes, students, classes_students');
  });

  describe('pre', () => {

    it('should return error if function returns false', (done) => {
      run('getStudentClassesFail', { test: 'test' }).catch((err) => {
        err.should.equal('React Agent: Not all server pre functions passed.');
        done();
      });
    });

    it('should return error if one out of multiple pre functions returns false', (done) => {
      run('getStudentsFail', { test: 'test' }).catch((err) => {
        err.should.equal('React Agent: Not all server pre functions passed.');
        done();
      });
    });

    it('should pass the request object to the action if all pre functions pass', (done) => {
      run('getStudentByID', { id: 3 })
          .then(data => {
            data.should.equal('Tiffany');
            done();
          })
          .catch(err => console.log('Error getStudentByID:', err));
    });

  });

  describe('action', () => {

    it('should execute SQL command with ? replacement', (done) => {
      run('getStudentsInTwoClasses', { class1: 'Algorithms', class2: 'Examining Gender in the 21st C.' })
        .then( data => {
          data.names.should.deep.equal([ 'Jaimie', 'Peter', 'Justin' ]);
          done();
        })
    })

    it('should resolve non-SQL functions', (done) => {
      run('getImage', { url: 'https://raw.githubusercontent.com/yokyak/react-agent/master/docs/imgs/diagram-after.gif' })
        .then(data => {
          data.should.equal('success');
          done();
        })
    });
  });

  describe('callback', (done) => {

    it('should execute with response from action and should return values to client', (done) => {
      const students = [ 'Tom', 'Henry', 'Tiffany', 'Andrew', 'Eric', 'Althea', 'Monica', 'Mike', 'Peter', 'Justin', 'Jaimie', 'Annie', 'Dale', 'Erik' ];
      run('getStudents')
        .then(data => {
          data.should.deep.equal(students)
          done();
        })
    });
  });

  describe('errorMessage', (done) => {

    it('should send default error to client for database errors', (done) => {
      run('addClassDatabaseError')
        .catch(err => {
          err.should.equal('Error with database')
          done();
        })
    });

    it('should send default error to client for action function errors', (done) => {
      run('actionFuncError')
        .catch(err => {
          err.should.equal('The action for actionFuncError rejected its promise.')
          done();
        })
    });

    it('should overwrite default error message', (done) => {
      run('addClassNewError')
        .catch(err => {
          err.should.equal(`Class entry error for action 'addClassNewError'`);
          done();
        })
    });
  });

  describe('logger', () => {

    it('should log key, actionID, client object, pre, and completed', (done) => {
      run('fullLog', {test: 'test'})
        .then(data => {
          messages[messages.length - 4].slice(0 , 45).should.have.lengthOf(45); // checking to see if UUID is included
          messages[messages.length - 4].slice(0, 14).should.equal(`Key: fullLogID`);
          messages[messages.length - 3].should.equal('  From client: {"test":"test"}');
          messages[messages.length - 2].should.equal('  Pre: Passed all function(s)');
          messages[messages.length - 1].slice(0, 20).should.equal('  Completed: fullLog');
          messages[messages.length - 1].slice(0, 45).should.have.lengthOf(45); // checking to see if UUID is included
          done();
        })
    });

    it('should log pre errors with one function', (done) => {
      run('preErrorSingleFunction', {test: 'test'})
        .catch(data => {
          messages[messages.length - 2].should.equal('  Pre-error: did not pass pre function')
          done();
        })
    })

    it('should log pre errors with multiple functions', (done) => {
      run('preErrorMultipleFunctions', {test: 'test'})
        .catch(data => {
          messages[messages.length - 2].should.equal('  Pre-error: did not pass function #2')
          done();
        })
    })

    it('should log errors with the database', (done) => {
      run('databaseError', {test: 'test'})
      .catch(data => {
        messages[messages.length - 2].should.equal('  Error with database: SequelizeDatabaseError: column s.names does not exist')
        done();
      })
    })

    it('should log rejections with the action function', (done) => {
      run('actionFunctionError', {test: 'test'})
      .catch(data => {
        messages[messages.length - 2].should.equal('  Action function: rejected')
        done();
      })
    })
  });
});

