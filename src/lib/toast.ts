import toast from 'react-hot-toast';

type CustomToastMessage = Parameters<typeof toast.custom>[0];

export const showToast = {
  success: (message: string, options?: any) =>
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
    }),

  error: (message: string, options?: any) =>
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
    }),

  loading: (message: string, options?: any) =>
    toast.loading(message, {
      position: 'top-right',
      ...options,
    }),

  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: any
  ) => {
    return toast.promise(promise, messages, {
      position: 'top-right',
      ...options,
    });
  },

  custom: (element: CustomToastMessage, options?: any) =>
    toast.custom(element, {
      duration: 4000,
      position: 'top-right',
      ...options,
    }),

  dismiss: (id?: string) => {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  },
};
