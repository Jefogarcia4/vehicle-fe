import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, KeyRound, LogOut, Save } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/form'
import { api, apiError } from '@/lib/api'
import { initials } from '@/lib/format'
import { useAuth } from '@/features/auth/AuthContext'
import { DriverProfileCard } from '@/features/driver/DriverProfileCard'

export default function ProfilePage() {
  const { user, refresh, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState({
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
    city: user?.city ?? '',
  })
  const [profileState, setProfileState] = useState<{ saving: boolean; error: string; done: boolean }>({
    saving: false,
    error: '',
    done: false,
  })

  const [passwords, setPasswords] = useState({ current: '', next: '' })
  const [passwordState, setPasswordState] = useState<{ saving: boolean; error: string; done: boolean }>({
    saving: false,
    error: '',
    done: false,
  })

  const saveProfile = async () => {
    setProfileState({ saving: true, error: '', done: false })
    try {
      await api.put('/auth/me', profile)
      await refresh()
      setProfileState({ saving: false, error: '', done: true })
    } catch (err) {
      setProfileState({ saving: false, error: apiError(err), done: false })
    }
  }

  const changePassword = async () => {
    setPasswordState({ saving: true, error: '', done: false })

    if (passwords.next.length < 6) {
      setPasswordState({ saving: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.', done: false })
      return
    }

    try {
      await api.post('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      })
      setPasswords({ current: '', next: '' })
      setPasswordState({ saving: false, error: '', done: true })
    } catch (err) {
      setPasswordState({ saving: false, error: apiError(err), done: false })
    }
  }

  return (
    <>
      <PageHeader
        title="Mi perfil"
        subtitle="Tus datos, tu licencia de conducción y la seguridad de tu cuenta."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card card-pad">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-600 font-display text-lg font-bold text-white">
              {initials(user?.fullName)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg">{user?.fullName}</h2>
              <p className="truncate text-sm text-carbon-500">{user?.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {profileState.error && (
              <p className="rounded-xl bg-danger-50 px-4 py-2.5 text-sm text-danger-700">{profileState.error}</p>
            )}

            <Field label="Nombre completo">
              <Input
                value={profile.fullName}
                onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Celular">
                <Input
                  value={profile.phone ?? ''}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                />
              </Field>

              <Field label="Ciudad">
                <Input
                  value={profile.city ?? ''}
                  onChange={(event) => setProfile({ ...profile, city: event.target.value })}
                />
              </Field>
            </div>

            <Button
              loading={profileState.saving}
              onClick={saveProfile}
              icon={profileState.done ? <Check className="size-4" /> : <Save className="size-4" />}
            >
              {profileState.done ? 'Guardado' : 'Guardar cambios'}
            </Button>
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="text-lg">Cambiar contraseña</h2>
          <p className="mt-1 text-sm text-carbon-500">Necesitas la actual para poder cambiarla.</p>

          <div className="mt-6 space-y-4">
            {passwordState.error && (
              <p className="rounded-xl bg-danger-50 px-4 py-2.5 text-sm text-danger-700">{passwordState.error}</p>
            )}
            {passwordState.done && (
              <p className="rounded-xl bg-ok-50 px-4 py-2.5 text-sm text-ok-700">Contraseña actualizada.</p>
            )}

            <Field label="Contraseña actual">
              <Input
                type="password"
                autoComplete="current-password"
                value={passwords.current}
                onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
              />
            </Field>

            <Field label="Nueva contraseña" hint="Mínimo 6 caracteres.">
              <Input
                type="password"
                autoComplete="new-password"
                value={passwords.next}
                onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
              />
            </Field>

            <Button
              variant="dark"
              loading={passwordState.saving}
              onClick={changePassword}
              icon={<KeyRound className="size-4" />}
            >
              Cambiar contraseña
            </Button>
          </div>

          <div className="mt-8 border-t border-carbon-100 pt-5">
            <Button
              variant="ghost"
              icon={<LogOut className="size-4" />}
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        </section>
      </div>

      {/* La licencia es de la persona, no del carro: quien tiene tres vehículos tiene una sola. */}
      <section className="mt-6">
        <h2 className="text-lg">Perfil del conductor</h2>
        <p className="mt-1 mb-4 text-sm text-carbon-500">
          Lo que el RUNT sabe de ti. Llega con la consulta oficial de tus placas.
        </p>
        <DriverProfileCard />
      </section>
    </>
  )
}
