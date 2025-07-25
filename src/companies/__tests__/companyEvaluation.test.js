import { test, expect } from '@jest/globals';
import { isInternal } from '../companyEvaluation';

test('once and for all', () => {
    expect(isInternal()).toBeFalsy()
    expect(isInternal([], [], {})).toBeFalsy()
    expect(isInternal([{id: 20001, internal:true}], [{id: 30001, companyId: 20001}], {vehicleId: 30001})).toBeTruthy()
    expect(isInternal([{id: 20001}], [{id: 30001, companyId: 20001}], {vehicleId: 30001})).toBeFalsy()
    expect(isInternal([], [{id: 30001, companyId: 20001}], {vehicleId: 30001})).toBeFalsy()
    expect(isInternal(undefined, undefined, {vehicleId: 30001})).toBeFalsy()
    expect(isInternal([{id: 20001, internal:true}], undefined, {vehicleId: 30001})).toBeFalsy()
    
})