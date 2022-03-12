import { AxiosResponse } from 'axios'
import { useQuery, useQueryClient } from 'react-query'
import type { User } from '../../../../../shared/types'
import { axiosInstance, getJWTHeader } from '../../../axiosInstance'
import { queryKeys } from '../../../react-query/constants'
import {
	clearStoredUser,
	getStoredUser,
	setStoredUser
} from '../../../user-storage'

async function getUser(user: User | null, signal: AbortSignal): Promise<User | null> {
	if (!user) return null
	const { data }: AxiosResponse<{ user: User }> = await axiosInstance.get(
		`/user/${user.id}`,
		{
			headers: getJWTHeader(user), signal
		}
	)
	return data.user
}

interface UseUser {
	user: User | null
	updateUser: (user: User) => void
	clearUser: () => void
}

export function useUser(): UseUser {
	const queryClient = useQueryClient()
	const { data: user } = useQuery(queryKeys.user, ({ signal, }) => getUser(user, signal), {
		initialData: getStoredUser(), // so that when the user REFRESHES the page after they logged in, they're still logged in (by the data that is persisted in localStorage from the onSuccess option below)
		onSuccess: (received: User | null) => {
			if (!received) clearStoredUser()
			// null: user logged out
			else setStoredUser(received)
		},
	})

	// update the user in the query cache
	function updateUser(newUser: User): void {
		queryClient.setQueryData(queryKeys.user, newUser)
	}

	// meant to be called from useAuth
	function clearUser() {
		queryClient.removeQueries([queryKeys.appointments, queryKeys.user])

		// not using removeQueries(queryKeys.user) because it won't trigger the {onSuccess}
		queryClient.setQueryData(queryKeys.user, null)
	}

	return { user, updateUser, clearUser }
}
