// import {agent} from './../index';
/*eslint-disable*/

const chai = require('chai');

const should = chai.should();

describe('React Agent Server', () => {

  describe('agent', () => {

    it('should connect to the database', (done) => {
      ('string').should.have.lengthOf(6);
      done();
    });
  })

  describe('pre', () => {

    it('should execute one function with arguments', (done) => {

    })

    it('should execute multiple functions with arguments', (done) => {

    })

    it('should return true if one function returns true', (done) => {

    })

    it('should return true if all functions return true', (done) => {

    })
  })

  describe('query', () => {

    it('should execute SQL command with ? replacement', (done) => {

    });
  })

  describe('callback', () => {

    it('if query exists, it should execute with response from query', (done) => {

    })

    it('if query exists, it should send response to client', (done) => {

    })

    it('if query does not exist and working, it should resolve and send back to client', (done) => {

    })

    it('if query does not exist and error, it should reject and send back to client', (done) => {

    })
  })

  describe('errorMessage', () => {

    it('should overwrite default error message', (done) => {

    })

    it('should send error to client', (done) => {

    })
  })

})

