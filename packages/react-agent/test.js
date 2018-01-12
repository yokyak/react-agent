const chai = require('chai');
const should = chai.should();
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
import React, { Component } from 'react';
import { render } from 'react-dom';
import { Agent, get, set, getStore } from './index';

describe('React Agent Client', () => {

  const initialStore = { first: 'firstValue', second: 'secondValue' };
  const dom = new JSDOM(`<!DOCTYPE html><div id='root'></div>`);
  
  render(
    <Agent store={initialStore} server='false'>
      <div>
        React Agent
      </div>
    </Agent>
    , dom.window.document.querySelector('#root'));

  const store = getStore();

  describe('Agent Component', () => {
    it('should extend the React Component class', () => {
      (store instanceof Component).should.equal(true);
    });
    it('should have a state that matches the initial store passed in', () => {
      store.state.should.equal(initialStore);
    });
  });
  describe('set method', () => {
    it('should add to the store with the proper key and value', () => {
      set('third', 'thirdValue', false);
      store.state['third'].should.equal('thirdValue');
    });
  });
  describe('get method', () => {
    it('should retrieve proper value from the store with the given key', () => {
      get('first').should.equal('firstValue');
      get('second').should.equal('secondValue');
    });
  });
});