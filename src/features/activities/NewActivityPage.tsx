import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useMutation, useQuery } from '../auth/hooks';
import { parseClassroom } from '../classrooms/api';
import type { VersionSummary } from '../questions/api';
import { invalidResponse } from '../../shared/api/http';
import { useLeaveGuard } from '../../shared/ui/useLeaveGuard';
import { Icon } from '../../shared/ui/Icon';
import { VersionPicker } from './VersionPicker';
import { parseActivitySummary } from './api';

function ActivityForm({ classroomId }: { classroomId: string }) {
  const { call } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState<VersionSummary | null>(null);
  const mutation = useMutation();
  const allowLeave = useLeaveGuard(!!(title || description || version), mutation.pending);
  const valid =
    title.trim().length >= 3 && !/[\u0000-\u001f\u007f]/u.test(title.trim()) && !!version;
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || !version) return;
    void mutation.run(
      async (signal) => {
        const created = parseActivitySummary(
          await call(`/api/classrooms/${classroomId}/activities`, {
            method: 'POST',
            signal,
            body: { title: title.trim(), description, questionVersionId: version.id },
          }),
        );
        if (
          created.classroom.id !== classroomId ||
          created.questionVersion.id !== version.id ||
          created.status !== 'DRAFT'
        )
          return invalidResponse();
        return created;
      },
      (created) => {
        allowLeave();
        window.location.hash = `#/atividades/${created.id}`;
      },
    );
  }
  return (
    <>
      <fieldset disabled={mutation.pending} className="activity-fields">
        <form id="create-activity" className="learning-panel" onSubmit={create}>
          <h2>Informações da atividade</h2>
          <label className="learning-field">
            Título da atividade
            <input
              required
              minLength={3}
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Prática de entrada e saída"
            />
          </label>
          <label className="learning-field">
            Orientações <span className="optional">opcional</span>
            <textarea
              maxLength={5000}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Orientações para a turma"
            />
          </label>
        </form>
        <VersionPicker selected={version} onSelect={setVersion} />
      </fieldset>
      {mutation.error && (
        <div className="feedback warning" role="alert">
          <p>{mutation.error}</p>
          <a className="text-link" href={`#/turmas/${classroomId}`}>
            Consultar atividades da turma
          </a>
        </div>
      )}
      <div className="activity-create-actions">
        <p className="muted small">
          A atividade será salva como rascunho. Abra-a depois para disponibilizar à turma.
        </p>
        <button
          className="button primary"
          form="create-activity"
          disabled={!valid || mutation.pending}
        >
          {mutation.pending ? 'Criando…' : 'Criar atividade'}
        </button>
      </div>
    </>
  );
}
export function NewActivityPage({ classroomId }: { classroomId: string }) {
  const classroom = useQuery(`/api/classrooms/${classroomId}`, parseClassroom);
  return (
    <main className="learning-main">
      <a className="text-link back-link" href={`#/turmas/${classroomId}`}>
        <Icon name="left" />
        Voltar à turma
      </a>
      {classroom.state.phase === 'loading' && (
        <p className="query-state" role="status">
          Carregando turma…
        </p>
      )}
      {classroom.state.phase === 'error' && (
        <section className="query-state learning-panel">
          <h1>Turma indisponível</h1>
          <p className="feedback warning" role="alert">
            {classroom.state.message}
          </p>
          <button className="button secondary" onClick={classroom.refresh}>
            Consultar turma novamente
          </button>
        </section>
      )}
      {classroom.state.phase === 'ready' && (
        <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">{classroom.state.data.name}</span>
              <h1>Nova atividade</h1>
              <p className="muted">Vincule uma versão publicada a esta turma.</p>
            </div>
          </div>
          <ActivityForm classroomId={classroomId} />
        </>
      )}
    </main>
  );
}
