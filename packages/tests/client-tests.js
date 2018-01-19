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
  });
  describe('get method', () => {
    it('should retrieve proper value from the store with the given key', () => {
      get('first').should.equal('firstValue');
      get('second').should.equal('secondValue');
    });
  });
});
