import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, jest } from '@jest/globals'
import NavigationBar from '../NavigationBar';

import { useNavigate, useLocation } from 'react-router-dom';

afterAll(() => jest.clearAllMocks())

test('render navigation bar', async () => {
    const user = userEvent.setup()

    useLocation.mockReturnValue({pathname: '/'})

    const setSearchByDate = jest.fn()
    render(<NavigationBar setSearchByDate={setSearchByDate} totalFilteredServices={3} totalFilteredOrders={2} selectedSearchOptions={[{name: 'J 23'}, {name: 'oil'}]}></NavigationBar>)

    // test navigate, for suppliers
    await user.click(screen.getByRole('button', {name: 'Suppliers'}))
    expect(useNavigate()).lastCalledWith('/orders')

    await user.click(screen.getByRole('button', {name: 'Schedules'}))
    expect(useNavigate()).lastCalledWith('/schedules')

    await user.click(screen.getByRole('button', {name: 'Vehicles'}))
    expect(useNavigate()).lastCalledWith('/vehicles')

    await user.click(screen.getByRole('button', {name: 'Parts'}))
    expect(useNavigate()).lastCalledWith('/spare-parts')

    await user.click(screen.getByRole('button', {name: 'Home'}))
    expect(useNavigate()).lastCalledWith('/')

    await user.click(screen.getByRole('button', {name: 'more for services'}))
    await user.click(screen.getByRole('button', {name: 'Tasks'}))
    expect(useNavigate()).lastCalledWith('/workmanships')

    // test the dropdown to search
    expect(screen.queryAllByPlaceholderText('Choose by vehicle(s) and/or spart part(s)')).toHaveLength(1)

    // click the calendar
    await user.click(screen.getByRole('button', {name: 'search by date'}))
    expect(setSearchByDate).toBeCalledWith(true)
})

test('render navigation bar with date search', async () => {
    const user = userEvent.setup()

    useLocation.mockReturnValue({pathname: '/'})

    const clearFilterDate = jest.fn() 
    const setSelectedSearchDate = jest.fn()
    render(<NavigationBar setSelectedSearchDate={setSelectedSearchDate} totalSpareParts={3} selectedSearchOptions={[]} searchByDate={true} clearFilterDate={clearFilterDate}></NavigationBar>)

    // test navigate
    await user.click(screen.getByRole('button', {name: 'Schedules'}))
    expect(useNavigate()).lastCalledWith('/schedules')

    // test the dropdown to search
    expect(screen.queryAllByPlaceholderText('Choose by vehicle(s) and/or spart part(s)')).toHaveLength(0)

    // key in date
    await user.click(screen.getByPlaceholderText('Choose a date'))
    await user.keyboard('2005-01-14')
    expect(setSelectedSearchDate).toBeCalledWith('2005-01-14')

    // remove date
    await user.click(screen.getByRole('button', {name: 'clear date'}))
    expect(clearFilterDate).toBeCalledTimes(1)
})

test('render navigation bar with toast box', async () => {
    const user = userEvent.setup()

    useLocation.mockReturnValue({pathname: '/'})

    const setShowToastBox = jest.fn()
    render(<NavigationBar setShowToastBox={setShowToastBox} selectedSearchOptions={[]} showToastBox={true} toastBoxMessage='Hello Warning'></NavigationBar>)

    expect(screen.queryAllByText('Warning')).toHaveLength(1)
    expect(screen.queryAllByText('Hello Warning')).toHaveLength(1)

    // close the toast box
    await user.click(screen.getByRole('button', {name: 'Close'}))
    expect(setShowToastBox).toBeCalledWith(false)
})