import { Appointment } from '../../../../../shared/types';
import { axiosInstance } from '../../../axiosInstance';
import { queryKeys } from '../../../react-query/constants';
import { useCustomToast } from '../../app/hooks/useCustomToast';
import { useMutation, UseMutateFunction, useQueryClient } from 'react-query'
import { AppointmentDateMap } from '../types';

async function removeAppointmentUser(appointment: Appointment): Promise<void> {
	const patchData = [{ op: 'remove', path: '/userId' }];
	await axiosInstance.patch(`/appointment/${appointment.id}`, {
		data: patchData,
	});
}


export function useCancelAppointment(): UseMutateFunction<void, unknown, Appointment, unknown> {
	const toast = useCustomToast();
	const queryClient = useQueryClient()

	const { mutate } = useMutation(removeAppointmentUser, {
		onSuccess: () => {
			queryClient.invalidateQueries([queryKeys.appointments])
			toast({
				title: 'Appointment canceled.',
				status: 'warning'
			})
		},
	}
	);

	return mutate
}
