import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useMutation, useQuery } from '../auth/hooks';
import { QuestionPreview } from '../questions/QuestionPreview';
import { Icon } from '../../shared/ui/Icon';
import { Modal } from '../../shared/ui/Modal';
import { useLeaveGuard } from '../../shared/ui/useLeaveGuard';
import { invalidResponse } from '../../shared/api/http';
import {
  parseActivity,
  parseActivitySummary,
  statusLabels,
  type Activity,
  type ActivitySummary,
} from './api';

function LifecycleAction({
  activity,
  onClose,
  onChanged,
  onRefresh,
}: {
  activity: Activity;
  onClose: () => void;
  onChanged: (value: ActivitySummary) => void;
  onRefresh: () => void;
}) {
  const { call } = useAuth();
  const mutation = useMutation();
  useLeaveGuard(false, mutation.pending);
  const opening = activity.status === 'DRAFT';
  return (
    <Modal
      title={opening ? 'Abrir atividade?' : 'Encerrar atividade?'}
      busy={mutation.pending}
      onClose={onClose}
    >
      <p>
        {opening
          ? 'A turma poderá consultar o enunciado e os casos públicos desta versão.'
          : 'O encerramento é definitivo: esta atividade não poderá ser reaberta. A turma continuará podendo consultar seu conteúdo.'}
      </p>
      {mutation.error && (
        <>
          <p role="alert" className="feedback warning">
            {mutation.error}
          </p>
          <button className="button secondary" disabled={mutation.pending} onClick={onRefresh}>
            Consultar estado da atividade
          </button>
        </>
      )}
      <div className="modal-actions">
        <button className="button secondary" disabled={mutation.pending} onClick={onClose}>
          Cancelar
        </button>
        <button
          className={`button ${opening ? 'primary' : 'danger-button'}`}
          disabled={mutation.pending}
          onClick={() =>
            void mutation.run(async (signal) => {
              const updated = parseActivitySummary(
                await call(`/api/activities/${activity.id}/${opening ? 'open' : 'close'}`, {
                  method: 'POST',
                  signal,
                  messages: {
                    409: 'O estado da atividade mudou. Consulte a atividade antes de continuar.',
                  },
                }),
              );
              if (
                updated.id !== activity.id ||
                updated.classroom.id !== activity.classroom.id ||
                updated.questionVersion.id !== activity.questionVersion.id ||
                updated.status !== (opening ? 'OPEN' : 'CLOSED')
              )
                return invalidResponse();
              return updated;
            }, onChanged)
          }
        >
          {mutation.pending ? 'Atualizando…' : opening ? 'Abrir atividade' : 'Encerrar atividade'}
        </button>
      </div>
    </Modal>
  );
}
export function ActivityPage({ id }: { id: string }) {
  const { state: auth } = useAuth();
  const teacher = auth.phase === 'authenticated' && auth.session.user.role === 'TEACHER';
  const resource = useQuery(`/api/activities/${id}`, parseActivity);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState('');
  function refresh() {
    setConfirming(false);
    setNotice('');
    resource.refresh();
  }
  return (
    <main className="learning-main">
      {resource.state.phase === 'loading' && (
        <p role="status" className="query-state">
          Carregando atividade…
        </p>
      )}
      {resource.state.phase === 'error' && (
        <section className="learning-panel query-state">
          <h1>Atividade indisponível</h1>
          <p className="feedback warning" role="alert">
            {resource.state.message}
          </p>
          <button className="button secondary" onClick={refresh}>
            Consultar atividade novamente
          </button>
          <a className="text-link" href="#/turmas">
            Minhas turmas
          </a>
        </section>
      )}
      {resource.state.phase === 'ready' && (
        <>
          <a className="text-link back-link" href={`#/turmas/${resource.state.data.classroom.id}`}>
            <Icon name="left" />
            {resource.state.data.classroom.name}
          </a>
          <section className="classroom-summary">
            <span className="eyebrow">ATIVIDADE DA TURMA</span>
            <div className="page-heading">
              <div>
                <h1>{resource.state.data.title}</h1>
                <p className="muted">
                  {resource.state.data.questionVersion.title} · versão{' '}
                  {resource.state.data.questionVersion.number}
                </p>
              </div>
              <span className={`activity-status ${resource.state.data.status.toLowerCase()}`}>
                {statusLabels[resource.state.data.status]}
              </span>
            </div>
            {resource.state.data.description && (
              <p className="preserve-text">{resource.state.data.description}</p>
            )}
            <p className="muted small">
              {resource.state.data.status === 'DRAFT'
                ? 'Este rascunho ainda não está disponível para os alunos.'
                : resource.state.data.status === 'OPEN'
                  ? 'Aberta para consulta pela turma.'
                  : 'Atividade encerrada. O conteúdo permanece disponível para consulta.'}
            </p>
            <div className="activity-dates">
              {resource.state.data.openedAt && (
                <span>
                  Aberta em {new Date(resource.state.data.openedAt).toLocaleString('pt-BR')}
                </span>
              )}
              {resource.state.data.closedAt && (
                <span>
                  Encerrada em {new Date(resource.state.data.closedAt).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
            <div className="activity-actions">
              {teacher && resource.state.data.status !== 'CLOSED' && (
                <button
                  className={`button ${resource.state.data.status === 'DRAFT' ? 'primary' : 'secondary'}`}
                  onClick={() => setConfirming(true)}
                >
                  {resource.state.data.status === 'DRAFT'
                    ? 'Abrir atividade'
                    : 'Encerrar atividade'}
                </button>
              )}
              <button className="button secondary" onClick={refresh}>
                Atualizar atividade
              </button>
            </div>
          </section>
          {notice && (
            <p className="feedback good" role="status">
              {notice}
            </p>
          )}
          <QuestionPreview content={resource.state.data.questionVersion} audience="student" />
          {confirming && (
            <LifecycleAction
              activity={resource.state.data}
              onClose={() => setConfirming(false)}
              onRefresh={refresh}
              onChanged={(updated) => {
                if (resource.state.phase !== 'ready') return;
                // B09 actions return a summary; the bound public version is immutable.
                resource.replace({
                  ...updated,
                  questionVersion: resource.state.data.questionVersion,
                });
                setConfirming(false);
                setNotice(
                  updated.status === 'OPEN'
                    ? 'Atividade aberta para a turma.'
                    : 'Atividade encerrada.',
                );
              }}
            />
          )}
        </>
      )}
    </main>
  );
}
