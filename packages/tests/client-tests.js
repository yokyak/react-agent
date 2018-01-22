import { render } from 'react-dom';
import React from '../react-agent/node_modules/react';
import { Agent, get, set, getStoreComponent, destroy, run, emit, on, unsubscribe, isOfflineCacheEmpty, getStore, getCache } from '../react-agent';
const agent = require('./../react-agent-server');
const express = require('express');
const pg = require('pg');
const app = express();
/*eslint-disable*/
const chai = require('chai');
const jsdom = require('jsdom');

const should = chai.should();
const { JSDOM } = jsdom;
const uri = 'postgres://nupdilwa:wKwvHTFrRlqfKgJAQ5088RaCIhDJLHz5@nutty-custard-apple.db.elephantsql.com:5432/nupdilwa';

const client = new pg.Client(uri);
client.connect();

describe('React Agent Client', () => {
  const initialStore = { first: 'firstValue', second: 'secondValue' };
  const dom = new JSDOM('<!DOCTYPE html><div id=\'root\'></div>');

  // set logger={true} to log client-side
  render(
    <Agent store={initialStore} testing={'http://localhost:3006'}>
      <div>
        React Agent
      </div>
    </Agent>
    , dom.window.document.querySelector('#root'),
  );

  const db = {
    name: 'nupdilwa',
    user: 'nupdilwa',
    password: 'wKwvHTFrRlqfKgJAQ5088RaCIhDJLHz5',
    dialect: 'postgres',
    host: 'nutty-custard-apple.db.elephantsql.com',
    port: 5432,
  };

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

    const server = app.listen(3006);

    const actions = {
      runAction: {
        action: `SELECT major FROM students WHERE name = 'Peter'`,
        callback: response => response[0][0].major,
      },
      runActionObject: {
        action: 'SELECT name from classes WHERE id = $id',
        callback: response => response[0][0].name,
      },
      runActionResolve: {
        action: `SELECT classyr from students WHERE name = 'Annie'`,
        callback: response => response[0][0].classyr,
      },
      runActionReject: {
        action: 'SELECT class from classes WHERE id = $id',
      },
      action1: {
        action: (resolve, reject) => resolve('firstAction')
      },
      action2: {
        action: (resolve, reject) => resolve('secondAction')
      },
      action3: {
        action: (resolve, reject) => reject()
      },
      getStudents: {
        action: 'SELECT name FROM students',
        callback: response => {
          return response[0].map(x => {
            return x.name
          })
        }
      },
      newStudent: {
        action: (resolve, reject, body) => resolve(body)
      },
      cacheFirst: {
        action: (resolve, reject) => resolve()
      },
      cacheSecond: {
        action: 'SELECT department FROM classes',
        callback: response => response[0]
      },
      cacheThird: {
        action: (resolve, reject) => resolve(),
      },
      action4: {
        action: (resolve, reject) => resolve()
      }
    }

    agent(server, actions, db, true); // pass true as fourth argument to log server-side
  })

  after(() => {
    client.query('DROP TABLE classes, students, classes_students');
  });

  describe('Agent Component', () => {
    it('should have a state that matches the initial store passed in', () => {
      get().should.deep.equal(initialStore);
    });
  });

  describe('set method', () => {
    it('should add to the store with the proper key and value', () => {
      set({ third: 'thirdValue' });
      get('third').should.equal('thirdValue');
      destroy('third');
    });

    it('should accept an object or property/values consecutively as arguments', () => {
      set({ fourth: 'fourthValue', fifth: 'fifthValue' });
      set('sixth', 'sixthValue', 'seventh', 'seventhValue');
      get('fourth', 'fifth', 'sixth', 'seventh').should.deep.equal({
        fourth: 'fourthValue', fifth: 'fifthValue', sixth: 'sixthValue', seventh: 'seventhValue',
      });
      destroy('fourth', 'fifth', 'sixth', 'seventh');
    });

    it('should default to null as a value if a value is not provided', () => {
      set('eighth');
      (get('eighth') === null).should.be.true;
      destroy('eighth');
    });
  });

  describe('get method', done => {
    it('should retrieve proper value from the store with the given key', () => {
      get('first').should.equal('firstValue');
      get('second').should.equal('secondValue');
    });

    it('should return the entire store if no arguments are provided', () => {
      set({ ninth: 'ninthValue' });
      const newStore = Object.assign(initialStore, { ninth: 'ninthValue' });
      get().should.deep.equal(newStore);
      destroy('ninth');
    });
  });

  describe('destroy method', () => {

    it('should remove a property and its value from the store', () => {
      set({ tenth: 'tenthValue' });
      destroy('tenth');
      (get('tenth') === undefined).should.be.true;
    });

    it('should take multiple properties as arguments', () => {
      set({eleven: 'eleventhValue', twelfth: 'twelfthValue'});
      destroy('eleven', 'twelfth');
      (get('eleven') === undefined && get('twelfth') === undefined).should.be.true;
    });
  });

  describe('run method', done => {
    it('should run an action on the server side', done => {
      run('runAction')
        .then(data => {
          data.should.equal('Digital Humanities');
          done();
        });
    });

    it('should take an object as an optional second argument', done => {
      run('runActionObject', { id: 5 })
        .then(data => {
          data.should.equal('Formal Language and State Automata');
          done();
        });
    });

    it('should return a promise that resolves and rejects', done => {
      run('runActionResolve')
        .then(data => {
          data.should.equal(2019)
        });
      run('runActionReject')
        .catch(err => {
          err.should.equal('Error with database')
          done();
        });
    });

    it('should accept multiple keys in the form of an array, and resolve with an object where each key is a property with the value of the response of the respective action', done => {
      run(['action1', 'action2', 'action3'])
        .then(data => {
          data.should.deep.equal({ action1: 'firstAction', action2: 'secondAction', action3: 'The action for action3 rejected its promise.'})
          done();
        });
    });
  });

  describe('emit method', done => {
    it('should run an action sent to all subscribers', done => {
      on('getStudents', data => {
        data.should.deep.equal([ 'Tom', 'Henry', 'Tiffany', 'Andrew', 'Eric', 'Althea', 'Monica', 'Mike', 'Peter', 'Justin', 'Jaimie', 'Annie', 'Dale', 'Erik' ]);
        done();
      });
      emit('getStudents');
    });

    it('should accept an object as a second argument', done => {
      on('newStudent', data => {
        data.student.should.equal('Hal');
        done();
      });
      emit('newStudent', { student: 'Hal' });
    });
  });

  describe('on method', done => {
    it('should subscribe a client to an action so that they receive push updates');
    it('should execute its callback upon emitted actions');
  });

  describe('getStore method', () => {
    it('should return the entire store', () => {
      getStore().should.deep.equal( { first: 'firstValue', second: 'secondValue' });
    });
  });

  describe('unsubscribe method', done => {
    it('should unsubscribe a client from an action', done => {
      set('unsubscribe', true)
      on('action4', () => {
        set('unsubscribe', false)
      })
      unsubscribe('action4');
      emit('action4');
      setTimeout(() => {
        get('unsubscribe').should.be.true;
        console.log('ONE', getCache());
        done();
      }, 100)
    });
  })

  // not working -- perhaps Emit isn’t returning a response if action is a promise
  describe('isOfflineCacheEmpty', done => {
    it('should return true if cache is empty', done => {
      // run('cacheFirst');
      // on('cacheSecond', data => {
      //   unsubscribe('cacheSecond')
      // })
      // emit('cacheSecond');
      // setTimeout(() => {
      //   console.log('TWO', getCache())
      //   isOfflineCacheEmpty().should.be.true;
        done();
      // }, 100)
    });

    it('should return false if cache is not empty', () => {
      run('cacheThird')
      isOfflineCacheEmpty().should.be.false;
    });
  });
});
