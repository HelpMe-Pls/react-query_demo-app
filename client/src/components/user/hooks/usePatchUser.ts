import jsonpatch from 'fast-json-patch'
import { UseMutateFunction, useMutation, useQueryClient } from 'react-query'
import type { User } from '../../../../../shared/types'
import { axiosInstance, getJWTHeader } from '../../../axiosInstance'
import { queryKeys } from '../../../react-query/constants'
import { useCustomToast } from '../../app/hooks/useCustomToast'
import { useUser } from './useUser'

// for when we need a server function
async function patchUserOnServer(
	newData: User | null,
	originalData: User | null
): Promise<User | null> {
	if (!newData || !originalData) return null
	// create a patch for the difference between newData and originalData
	const patch = jsonpatch.compare(originalData, newData)

	// send patched data to the server
	const { data } = await axiosInstance.patch(
		`/user/${originalData.id}`,
		{ patch },
		{
			headers: getJWTHeader(originalData),
		}
	)
	return data.user
}


export function usePatchUser(): UseMutateFunction<User, unknown, User, unknown> {
	const { user, updateUser } = useUser()
	const toast = useCustomToast()
	const queryClient = useQueryClient()

	const { mutate: patchUser } = useMutation((newData: User) => patchUserOnServer(newData, user), {
		// returns a context that is passed to onError
		onMutate: async (newData: User | null) => {
			// cancel any ongoing queries for user data so that old server data doesn't overwrite our optimistic update
			await queryClient.cancelQueries(queryKeys.user)

			// create a snapshot of previous user value
			const previousUserData: User = queryClient.getQueryData(queryKeys.user)

			// OPTIMISTICALLY update the cache with new user value from the input
			updateUser(newData)

			// return context object with snapshotted value
			return { previousUserData }
		},
		// roll back the cache to the snapshotted value 
		onError: (_error, _newData, ctx) => {
			if (ctx.previousUserData) {
				updateUser(ctx.previousUserData)
				toast({
					title: "Update failed. You info has NOT been changed.",
					status: "warning"
				})
			}
		},
		onSuccess:	// userData is the return value from patchUserOnServer()
			() => {
				if (user) {
					toast({
						title: "Your info is updated.",
						status: "success"
					})
				}
			},
		// invalidate the query so that we're in sync with the latest data from the server
		onSettled: () => {
			queryClient.invalidateQueries(queryKeys.user);
		},
	})
	return patchUser
}

