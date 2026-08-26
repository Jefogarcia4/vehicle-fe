import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CarFront, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { VehicleCard } from '@/components/VehicleCard'
import { Input } from '@/components/ui/form'
import { EmptyState, ErrorState, Loading } from '@/components/ui/feedback'
import { apiError } from '@/lib/api'
import { useVehicles } from '@/features/vehicles/hooks'

export default function GaragePage() {
  const { data, isLoading, error, refetch } = useVehicles()
  const [search, setSearch] = useState('')

  if (isLoading) return <Loading />
  if (error) return <ErrorState message={apiError(error)} onRetry={refetch} />

  const term = search.trim().toLowerCase()
  const vehicles = (data ?? []).filter((vehicle) =>
    term
      ? [vehicle.nickname, vehicle.plate, vehicle.brand, vehicle.model]
          .join(' ')
          .toLowerCase()
          .includes(term)
      : true,
  )

  return (
    <>
      <PageHeader
        title="Mis vehículos"
        subtitle={`${data?.length ?? 0} vehículo${data?.length === 1 ? '' : 's'} registrado${data?.length === 1 ? '' : 's'}`}
        actions={
          <Link to="/app/vehiculos/nuevo" className="btn-primary btn-md">
            <Plus className="size-4" />
            Agregar vehículo
          </Link>
        }
      />

      {(data?.length ?? 0) > 3 && (
        <div className="relative mb-5 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-carbon-400" />
          <Input
            className="pl-10"
            placeholder="Buscar por placa, marca o apodo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}

      {vehicles.length === 0 ? (
        <EmptyState
          icon={<CarFront className="size-6" />}
          title={term ? 'Sin resultados' : 'Aún no tienes vehículos'}
          description={
            term
              ? 'Prueba con otra placa, marca o apodo.'
              : 'Registra tu carro o tu moto para llevar su historial completo.'
          }
          action={
            !term && (
              <Link to="/app/vehiculos/nuevo" className="btn-primary btn-md">
                <Plus className="size-4" />
                Registrar vehículo
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </>
  )
}
