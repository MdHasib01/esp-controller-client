import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCreateDeviceMutation,
  useDevicesQuery,
  useUpdateDeviceMutation,
} from '@/hooks/useDeviceQueries'

const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/

const createSchema = z.object({
  deviceId: z.string().min(1, 'Required — this must match the ESP32 firmware config'),
  name: z.string().min(1, 'Required'),
  mac: z.string().regex(macRegex, 'Format: AA:BB:CC:DD:EE:FF').or(z.literal('')),
  label: z.string().optional(),
})
type CreateForm = z.infer<typeof createSchema>

const editSchema = z.object({
  name: z.string().min(1, 'Required'),
  mac: z.string().regex(macRegex, 'Format: AA:BB:CC:DD:EE:FF').or(z.literal('')),
  label: z.string().optional(),
})
type EditForm = z.infer<typeof editSchema>

function AddDeviceCard({ onCreated }: { onCreated: (apiKey: string) => void }) {
  const createDevice = useCreateDeviceMutation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) })

  async function onSubmit(values: CreateForm) {
    try {
      const { apiKey } = await createDevice.mutateAsync({
        deviceId: values.deviceId,
        name: values.name,
        wakeTarget: { mac: values.mac || undefined, label: values.label || undefined },
      })
      reset()
      // Fires before the devices-list refetch (triggered by the mutation's
      // onSuccess) swaps this card out for EditDeviceCard — see SettingsPage.
      onCreated(apiKey)
    } catch {
      toast.error('Failed to register device — deviceId may already be in use')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add your ESP32</CardTitle>
        <CardDescription>
          Register the device so it can authenticate over WebSocket. You'll get a one-time API
          key to put in the firmware config.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="deviceId">Device ID</Label>
            <Input id="deviceId" placeholder="esp32-livingroom" {...register('deviceId')} />
            {errors.deviceId && <p className="text-xs text-destructive">{errors.deviceId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Living Room" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mac">PC MAC address (for Wake-on-LAN)</Label>
            <Input id="mac" placeholder="AA:BB:CC:DD:EE:FF" {...register('mac')} />
            {errors.mac && <p className="text-xs text-destructive">{errors.mac.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">PC label (optional)</Label>
            <Input id="label" placeholder="Desktop" {...register('label')} />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add device'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function EditDeviceCard({ device }: { device: NonNullable<ReturnType<typeof useDevicesQuery>['data']>[number] }) {
  const updateDevice = useUpdateDeviceMutation(device.id)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: device.name,
      mac: device.wakeTarget.mac ?? '',
      label: device.wakeTarget.label ?? '',
    },
  })

  useEffect(() => {
    reset({ name: device.name, mac: device.wakeTarget.mac ?? '', label: device.wakeTarget.label ?? '' })
  }, [device, reset])

  async function onSubmit(values: EditForm) {
    try {
      await updateDevice.mutateAsync({
        name: values.name,
        wakeTarget: { mac: values.mac || null, label: values.label || null },
      })
      toast('Device updated')
    } catch {
      toast.error('Failed to update device')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device settings</CardTitle>
        <CardDescription>Device ID: {device.deviceId} (set in the ESP32 firmware)</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-mac">PC MAC address (for Wake-on-LAN)</Label>
            <Input id="edit-mac" placeholder="AA:BB:CC:DD:EE:FF" {...register('mac')} />
            {errors.mac && <p className="text-xs text-destructive">{errors.mac.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-label">PC label (optional)</Label>
            <Input id="edit-label" {...register('label')} />
          </div>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function SettingsPage() {
  const devicesQuery = useDevicesQuery()
  const [issuedApiKey, setIssuedApiKey] = useState<string | null>(null)

  if (devicesQuery.isPending) {
    return <Skeleton className="h-64 rounded-xl" />
  }

  const device = devicesQuery.data?.[0]

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      {device ? (
        <EditDeviceCard device={device} />
      ) : (
        <AddDeviceCard onCreated={setIssuedApiKey} />
      )}

      <Dialog open={Boolean(issuedApiKey)} onOpenChange={(open) => !open && setIssuedApiKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save this API key now</DialogTitle>
            <DialogDescription>
              It won't be shown again. Paste it into the ESP32 firmware's auth config.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <code className="flex-1 overflow-x-auto text-sm">{issuedApiKey}</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (issuedApiKey) navigator.clipboard.writeText(issuedApiKey)
                toast('Copied to clipboard')
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <DialogFooter>
            <DialogClose render={<Button />}>Done</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
