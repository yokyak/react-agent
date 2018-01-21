import { render } from 'react-dom';
import React from '../react-agent/node_modules/react';
import { Agent, get, set, getStoreComponent } from '../react-agent';

const chai = require('chai');
const jsdom = require('jsdom');

const should = chai.should();
const { JSDOM } = jsdom;

describe('React Agent Client', () => {

  const initialStore = { first: 'firstValue', second: 'secondValue' };
  const dom = new JSDOM('<!DOCTYPE html><div id=\'root\'></div>');

  render(
    <Agent store={initialStore}>
      <div>
        React Agent
      </div>
    </Agent>
    , dom.window.document.querySelector('#root'));

  describe('Agent Component', () => {
    it('should have a state that matches the initial store passed in', () => {
      JSON.stringify(get()).should.equal(JSON.stringify(initialStore));
    });
  });
  describe('set method', () => {
    it('should add to the store with the proper key and value', () => {
      set({ third: 'thirdValue' });
      get('third').should.equal('thirdValue');
    });

    it('should accept an object or property/values consecutively as arguments', () => {
      set( { fourth: 'fourthValue', fifth: 'fifthValue' });
      set( 'sixth', 'sixthValue', 'seventh', 'seventhValue');
      get('fourth', 'fifth', 'sixth', 'seventh').should.equal(
        { fourth: 'fourthValue', fifth: 'fifthValue', sixth: 'sixthValue', seventh: 'seventhValue'});
    })

    it('should default to null as a value if a value is not provided')
  });
  describe('get method', () => {
    it('should retrieve proper value from the store with the given key', () => {
      get('first').should.equal('firstValue');
      get('second').should.equal('secondValue');
    });
    it('should return the entire store if no arguments are provided')

  });

  describe('destroy method', () => {
    it('should remove a property and its value from the store')
    it('should take multiple properties as arguments')
  })

  describe('run method', (done) => {
    it('should run an action on the client side')
    it('should take an object as an optional second argument')
    it('should return a promise that resolves and rejects')
    it('should accept multiple keys in the form of an array')
  })

  describe('emit method', (done) => {
    it('should run an action sent to all subscribers')
    it('should accept an object as a second argument')
  })

  describe('on method', (done) => {
    it('should subscribe a client to an action so that they receive push updates')
    it('should execute its callback upon emitted actions')
  })

  describe('getStore method', (done) => {
    it('should return the entire store')
  })

  describe('isOfflineCacheEmpty', (done) => {
    it('should return return true if cache is empty')
    it('should return return false if cache is not empty')
  })
});
