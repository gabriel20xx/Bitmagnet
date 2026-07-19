import { useSyncExternalStore } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { useTranslation } from 'react-i18next'
import { getToasts, subscribe, dismissToast } from '@/lib/toast/store'
import { cn } from '@/lib/utils/cn'

export function Toaster() {
  const { t } = useTranslation()
  const toasts = useSyncExternalStore(subscribe, getToasts)

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <ToastPrimitive.Root
          key={toast.id}
          duration={toast.expiry}
          onOpenChange={(open) => {
            if (!open) dismissToast(toast.id)
          }}
          className={cn(
            'flex items-center gap-4 rounded-md border border-danger bg-surface px-4 py-3 text-sm shadow-lg',
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[state=closed]:animate-out data-[state=closed]:fade-out-80',
          )}
        >
          <ToastPrimitive.Description className="flex-1 text-danger">{toast.message}</ToastPrimitive.Description>
          <ToastPrimitive.Close className="text-xs font-medium text-muted-fg hover:text-fg">
            {t('general.dismiss')}
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2" />
    </ToastPrimitive.Provider>
  )
}
