jest.unmock('../Component');

import React from 'react';
import Component from '../Component';

describe('<Component />', () => {

    describe('with default props', () => {
        const wrapper = enzyme.shallow(<Component />);

        it('should render', () => {
            expect(wrapper.hasClass('Component')).toEqual(true);
        });
    });

});
