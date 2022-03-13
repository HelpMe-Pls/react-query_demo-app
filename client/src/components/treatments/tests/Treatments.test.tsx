import { screen } from '@testing-library/react'
import { Treatments } from '../Treatments'
import { renderWithQueryClient } from '../../../test-utils'

test('renders response from query', () => {
	renderWithQueryClient(<Treatments />)
})
