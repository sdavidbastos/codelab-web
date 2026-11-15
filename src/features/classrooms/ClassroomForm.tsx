import { useState, type FormEvent } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { useMutation } from '../auth/hooks';
import { useAuth } from '../auth/AuthProvider';
import { parseClassroom, type Classroom } from './api';

export function ClassroomForm({
  classroom,
  onClose,
  onSaved,
}: {
  classroom?: Classroom;
  onClose: () => void;
  onSaved: (value: Classroom) => void;
}) {
  const { call } = useAuth();
  const [name, setName] = useState(classroom?.name ?? '');
  const [description, setDescription] = useState(classroom?.description ?? '');
  const mutation = useMutation();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutation.run(
      async (signal) =>
        parseClassroom(
          await call(classroom ? `/api/classrooms/${classroom.id}` : '/api/classrooms', {
            method: classroom ? 'PATCH' : 'POST',
            body: { name: name.trim(), description },
            signal,
          }),
        ),
      onSaved,
    );
  }
  return (
    <Modal
      title={classroom ? 'Editar turma' : 'Nova turma'}
      busy={mutation.pending}
      onClose={onClose}
    >
      <p className="muted">
        {classroom
          ? 'Atualize as informações da sua turma.'
          : 'Dê um nome à sua turma. Depois, adicione os alunos.'}
      </p>
      <form onSubmit={submit}>
        <label className="learning-field">
          Nome da turma
          <input
            name="name"
            required
            minLength={3}
            maxLength={120}
            value={name}
            disabled={mutation.pending}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Linguagem de Programação 1 — 2026.2"
          />
        </label>
        <label className="learning-field">
          Descrição <span className="optional">opcional</span>
          <textarea
            name="description"
            maxLength={2000}
            rows={4}
            value={description}
            disabled={mutation.pending}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Uma breve apresentação para os alunos."
          />
        </label>
        {mutation.error && (
          <p className="feedback warning" role="alert">
            {mutation.error}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={mutation.pending}
          >
            Cancelar
          </button>
          <button className="button primary" disabled={mutation.pending || name.trim().length < 3}>
            {mutation.pending ? 'Salvando…' : classroom ? 'Salvar alterações' : 'Criar turma'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
