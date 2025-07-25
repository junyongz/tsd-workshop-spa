import { jest, test, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ServiceNoteTakingDialog from '../ServiceNoteTakingDialog'

test('save simple note', async () => {
    const user = userEvent.setup()

    const onSaveNote = jest.fn()
    const setShowDialog = jest.fn()
    const ws = {id: 10001, vehicleNo: "J 23", startDate: "2005-01-01"}
    render(<ServiceNoteTakingDialog isShow={true} 
        onSaveNote={onSaveNote} setShowDialog={setShowDialog} ws={ws}>
        </ServiceNoteTakingDialog>)

    await user.click(screen.getByLabelText("notes for this service"))
    await user.keyboard("back to change tires")
    await user.click(screen.getByText('Save'))

    expect(onSaveNote).toBeCalledWith({id: 10001, notes: "back to change tires", 
        startDate: "2005-01-01", vehicleNo: "J 23"})

    // close it
    await user.click(screen.getByLabelText('Close'))
    expect(setShowDialog).toBeCalledWith(false)
})

