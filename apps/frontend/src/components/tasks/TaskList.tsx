import Link from 'next/link';
import { tasks, Task } from '@/data/tasks';
import { domainConfig } from '@/config/domains';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Paperclip, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusVariantMap = {
  success: 'success',
  in_progress: 'secondary',
  pending: 'outline',
} as const;

const TaskCard = ({ task }: { task: Task }) => {
  const DomainIcon = domainConfig[task.domain].icon;
  const domainColor = domainConfig[task.domain].color;

  return (
    <Card className="mb-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <DomainIcon className={cn('h-6 w-6', domainColor)} />
            <div>
              <p className="font-semibold">{task.activity}</p>
              <p className="text-sm text-muted-foreground capitalize">{task.domain}</p>
            </div>
          </div>
          <Badge variant={statusVariantMap[task.status]} className="capitalize">{task.status.replace('_', ' ')}</Badge>
        </div>
        <p className="text-sm text-muted-foreground pl-9">{task.description}</p>
        <div className="flex justify-between items-center pt-3 mt-3 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Modifier la tâche"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600"
              aria-label="Supprimer la tâche"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {task.attachment && (
              <Link
                href={task.attachment}
                className="flex items-center gap-1 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Voir la pièce jointe"
              >
                <Paperclip className="h-3 w-3" aria-hidden="true" />
              </Link>
            )}
            <span>{task.date}</span>
            <span>{task.duration}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function TaskList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des tâches</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop View: Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-36">Domaine</TableHead>
                <TableHead>Activité</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Pièce jointe</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Durée</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const DomainIcon = domainConfig[task.domain].icon;
                const domainColor = domainConfig[task.domain].color;
                return (
                  <TableRow key={task.id}>
                    <TableCell>{task.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DomainIcon className={cn('h-5 w-5', domainColor)} />
                        <span className="capitalize">{task.domain}</span>
                      </div>
                    </TableCell>
                    <TableCell>{task.activity}</TableCell>
                    <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                    <TableCell>
                      {task.attachment ? (
                        <Link 
                          href={task.attachment} 
                          className="flex items-center gap-1 hover:underline text-sm"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Voir la pièce jointe"
                        >
                          <Paperclip className="h-3 w-3" aria-hidden="true" />
                          Voir
                        </Link>
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                    <TableCell><Badge variant={statusVariantMap[task.status]} className="capitalize">{task.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-right">{task.duration}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          aria-label="Modifier la tâche"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          aria-label="Supprimer la tâche"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden p-4 border-t md:border-t-0">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
