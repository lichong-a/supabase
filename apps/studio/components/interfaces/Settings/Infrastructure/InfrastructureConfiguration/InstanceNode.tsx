import { useParams } from 'common'
import dayjs from 'dayjs'
import { Database, DatabaseBackup } from 'lucide-react'
import Link from 'next/link'
import { Handle, NodeProps, Position } from 'reactflow'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconHelpCircle,
  IconMoreVertical,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import { BASE_PATH, PROJECT_STATUS } from 'lib/constants'
import { NODE_SEP, NODE_WIDTH, REPLICA_STATUS, Region } from './InstanceConfiguration.constants'

interface NodeData {
  id: string
  provider: string
  region: Region
  computeSize: string
  status: string
  inserted_at: string
}

interface PrimaryNodeData extends NodeData {
  numReplicas: number
  numRegions: number
  hasLoadBalancer: boolean
}

interface LoadBalancerData extends NodeData {
  numDatabases: number
}

interface ReplicaNodeData extends NodeData {
  onSelectRestartReplica: () => void
  onSelectResizeReplica: () => void
  onSelectDropReplica: () => void
}

export const LoadBalancerNode = ({ data }: NodeProps<LoadBalancerData>) => {
  const { ref } = useParams()
  const { numDatabases } = data

  return (
    <>
      <div className="flex flex-col rounded bg-surface-100 border border-default">
        <div
          className="flex items-start justify-between p-3 gap-x-4"
          style={{ width: NODE_WIDTH / 2 - 10 }}
        >
          <div className="flex gap-x-3">
            <div className="min-w-8 h-8 bg-blue-600 border border-blue-800 rounded-md flex items-center justify-center">
              <Database size={16} />
            </div>
            <div className="flex flex-col gap-y-0.5">
              <p className="text-sm">API Load Balancer</p>
              <p className="text-sm text-foreground-light">
                Distributes incoming API requests across{' '}
                <span className="text-foreground">{numDatabases} databases</span>
              </p>
            </div>
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button type="text" icon={<IconMoreVertical />} className="px-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" side="bottom" align="end">
              <DropdownMenuItem asChild className="gap-x-2">
                <Link href={`/project/${ref}/settings/api?source=loadbalancer`}>View API URL</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Handle
        type="source"
        id="handle-b"
        position={Position.Bottom}
        style={{ background: 'transparent' }}
      />
    </>
  )
}

export const PrimaryNode = ({ data }: NodeProps<PrimaryNodeData>) => {
  const { provider, region, computeSize, numReplicas, numRegions, hasLoadBalancer } = data

  return (
    <>
      {hasLoadBalancer && (
        <Handle
          type="target"
          id="handle-t"
          position={Position.Top}
          style={{ background: 'transparent' }}
        />
      )}
      <div className="flex flex-col rounded bg-surface-100 border border-default">
        <div
          className="flex items-start justify-between p-3"
          style={{ width: NODE_WIDTH / 2 - 10 }}
        >
          <div className="flex gap-x-3">
            <div className="w-8 h-8 bg-brand-500 border border-brand-600 rounded-md flex items-center justify-center">
              <Database size={16} />
            </div>
            <div className="flex flex-col gap-y-0.5">
              <p className="text-sm">Primary Database</p>
              <p className="flex items-center gap-x-1">
                <span className="text-sm text-foreground-light">{region.name}</span>
              </p>
              <p className="flex items-center gap-x-1">
                <span className="text-sm text-foreground-light">{provider}</span>
                <span className="text-sm text-foreground-light">•</span>
                <span className="text-sm text-foreground-light">{computeSize}</span>
              </p>
            </div>
          </div>
          <img
            alt="region icon"
            className="w-8 rounded-sm mt-0.5"
            src={`${BASE_PATH}/img/regions/${region.key}.svg`}
          />
        </div>
        {numReplicas > 0 && (
          <div className="border-t p-3 py-2">
            <p className="text-sm text-foreground-light">
              <span className="text-foreground">
                {numReplicas} replica{numReplicas > 1 ? 's' : ''}
              </span>{' '}
              deployed across{' '}
              <span className="text-foreground">
                {numRegions} region{numRegions > 1 ? 's' : ''}
              </span>
            </p>
          </div>
        )}
      </div>
      {numReplicas > 0 && (
        <Handle
          type="source"
          id="handle-b"
          position={Position.Bottom}
          style={{ background: 'transparent' }}
        />
      )}
    </>
  )
}

export const ReplicaNode = ({ data }: NodeProps<ReplicaNodeData>) => {
  const {
    id,
    provider,
    region,
    computeSize,
    status,
    inserted_at,
    onSelectRestartReplica,
    onSelectResizeReplica,
    onSelectDropReplica,
  } = data
  const { ref } = useParams()
  const created = dayjs(inserted_at).format('DD MMM YYYY')

  return (
    <>
      <Handle
        type="target"
        id="handle-t"
        position={Position.Top}
        style={{ background: 'transparent' }}
      />
      <div
        className="flex justify-between items-start rounded bg-surface-100 border border-default p-3"
        style={{ width: NODE_WIDTH / 2 - 10 }}
      >
        <div className="flex gap-x-3">
          <div className="w-8 h-8 bg-brand-400 border border-brand-500 rounded-md flex items-center justify-center">
            <DatabaseBackup size={16} />
          </div>
          <div className="flex flex-col gap-y-0.5">
            <div className="flex items-center gap-x-2">
              <p className="text-sm truncate">
                Replica {id.length > 0 && `(ID: ${formatDatabaseID(id)})`}
              </p>
              {status === REPLICA_STATUS.ACTIVE_HEALTHY ? (
                <Badge color="green">Healthy</Badge>
              ) : status === REPLICA_STATUS.INIT_READ_REPLICA ? (
                <Badge color="slate">Initializing</Badge>
              ) : status === REPLICA_STATUS.INIT_READ_REPLICA_FAILED ? (
                <>
                  <Badge color="red">Init failed</Badge>
                  <Tooltip_Shadcn_>
                    <TooltipTrigger_Shadcn_>
                      <IconHelpCircle />
                    </TooltipTrigger_Shadcn_>
                    <TooltipContent_Shadcn_ side="bottom" className="w-60 text-center">
                      Replica failed to initialize. Please drop this replica, and spin up a new one.
                    </TooltipContent_Shadcn_>
                  </Tooltip_Shadcn_>
                </>
              ) : status === REPLICA_STATUS.COMING_UP ? (
                <Badge color="slate">Coming up</Badge>
              ) : status === REPLICA_STATUS.RESTORING ? (
                <Badge color="slate">Restoring</Badge>
              ) : (
                <Badge color="amber">Unhealthy</Badge>
              )}
            </div>
            <div className="my-0.5">
              <p className="text-sm text-foreground-light">{region.name}</p>
              <p className="flex text-sm text-foreground-light items-center gap-x-1">
                <span>{provider}</span>
                <span>•</span>
                <span>{computeSize}</span>
              </p>
            </div>
            <p className="text-sm text-foreground-light">Created: {created}</p>
          </div>
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="text" icon={<IconMoreVertical />} className="px-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40" side="bottom" align="end">
            <DropdownMenuItem
              disabled={status !== PROJECT_STATUS.ACTIVE_HEALTHY}
              className="gap-x-2"
            >
              <Link href={`/project/${ref}/settings/database?connectionString=${id}`}>
                View connection string
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem className="gap-x-2" onClick={() => onSelectRestartReplica()}>
                Restart replica
              </DropdownMenuItem> */}
            {/* <DropdownMenuItem className="gap-x-2" onClick={() => onSelectResizeReplica()}>
                Resize replica
              </DropdownMenuItem> */}
            <DropdownMenuItem className="gap-x-2" onClick={() => onSelectDropReplica()}>
              Drop replica
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

export const RegionNode = ({ data }: any) => {
  const { region, numReplicas } = data
  const regionNodeWidth =
    20 + (NODE_WIDTH / 2 - 10) * numReplicas + (numReplicas - 1) * (NODE_SEP + 10)

  return (
    <div
      className="relative flex justify-between rounded bg-black/10 border border-default border-white/10 border-2 p-3"
      style={{ width: regionNodeWidth, height: 162 }}
    >
      <div className="absolute bottom-2 flex items-center justify-between gap-x-2">
        <img
          alt="region icon"
          className="w-5 rounded-sm"
          src={`${BASE_PATH}/img/regions/${region.key}.svg`}
        />
        <p className="text-sm">{region.name}</p>
      </div>
    </div>
  )
}
