import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useMutation, useQuery } from '../auth/hooks';
import { Icon } from '../../shared/ui/Icon';
import { Modal } from '../../shared/ui/Modal';
import { Pagination } from '../../shared/ui/Pagination';
import { ClassroomForm } from './ClassroomForm';
import { parseClassroom, parseEnrollment, parseEnrollments, type Enrollment } from './api';

function Roster({ classroomId }: { classroomId: string }) {
  const { call } = useAuth();
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [removing, setRemoving] = useState<Enrollment | null>(null);
  const mutation = useMutation();
  const resource = useQuery(
    `/api/classrooms/${classroomId}/enrollments?page=${page}&pageSize=10`,
    parseEnrollments,
  );
  function enroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    void mutation.run(
      async (signal) =>
        parseEnrollment(
          await call(`/api/classrooms/${classroomId}/enrollments`, {
            method: 'POST',
            messages: { 409: 'Este aluno já está matriculado nesta turma.' },
            body: { email: email.trim().toLowerCase() },
            signal,
          }),
        ),
      (joined) => {
        setEmail('');
        setNotice(`${joined.student.name} foi matriculado(a).`);
        resource.refresh();
      },
    );
  }
  return (
    <section className="learning-panel roster-panel" aria-labelledby="roster-title">
      <div className="section-heading">
        <div>
          <h2 id="roster-title">Alunos da turma</h2>
          <p className="muted">Gerencie quem pode acessar este espaço.</p>
        </div>
        {resource.state.phase === 'ready' && (
          <span className="count-pill">
            {resource.state.data.total} {resource.state.data.total === 1 ? 'aluno' : 'alunos'}
          </span>
        )}
      </div>
      <form className="enrollment-form" onSubmit={enroll}>
        <label className="learning-field">
          E-mail do aluno
          <input
            type="email"
            required
            maxLength={254}
            value={email}
            disabled={mutation.pending}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="aluno@exemplo.com"
          />
        </label>
        <button className="button primary" disabled={mutation.pending}>
          <Icon name="plus" />
          {mutation.pending ? 'Matriculando…' : 'Matricular aluno'}
        </button>
        <p className="muted small">Use o e-mail de uma conta de aluno já cadastrada.</p>
      </form>
      {mutation.error && (
        <p className="feedback warning" role="alert">
          {mutation.error}
        </p>
      )}
      {notice && (
        <p className="feedback good" role="status">
          {notice}
        </p>
      )}
      {resource.state.phase === 'loading' && (
        <p className="query-state" role="status">
          Carregando alunos…
        </p>
      )}
      {resource.state.phase === 'error' && (
        <div className="query-state">
          <p className="feedback warning" role="alert">
            {resource.state.message}
          </p>
          <button className="button secondary" onClick={resource.refresh}>
            Consultar alunos novamente
          </button>
        </div>
      )}
      {resource.state.phase === 'ready' && (
        <>
          {resource.state.data.items.length === 0 ? (
            <div className="empty-state compact">
              <Icon name="users" />
              <h3>Nenhum aluno nesta página</h3>
              <p>Matricule um aluno pelo e-mail para dar acesso à turma.</p>
            </div>
          ) : (
            <div className="roster-table-wrap">
              <table className="roster-table">
                <caption className="visually-hidden">Alunos com matrícula ativa</caption>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>E-mail</th>
                    <th>
                      <span className="visually-hidden">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resource.state.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="student-name">
                          <span className="avatar" aria-hidden="true">
                            {item.student.name.slice(0, 1).toUpperCase()}
                          </span>
                          {item.student.name}
                        </span>
                      </td>
                      <td>{item.student.email}</td>
                      <td>
                        <button
                          className="text-button danger"
                          aria-label={`Remover ${item.student.name}`}
                          onClick={() => setRemoving(item)}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={page}
            pageSize={resource.state.data.pageSize}
            total={resource.state.data.total}
            onPage={setPage}
          />
        </>
      )}
      {removing && (
        <RemoveEnrollment
          enrollment={removing}
          classroomId={classroomId}
          onClose={() => setRemoving(null)}
          onRemoved={() => {
            setNotice(`Matrícula de ${removing.student.name} removida.`);
            setRemoving(null);
            if (
              page > 1 &&
              resource.state.phase === 'ready' &&
              resource.state.data.items.length === 1
            )
              setPage(page - 1);
            else resource.refresh();
          }}
        />
      )}
    </section>
  );
}
function RemoveEnrollment({
  enrollment,
  classroomId,
  onClose,
  onRemoved,
}: {
  enrollment: Enrollment;
  classroomId: string;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const { call } = useAuth();
  const mutation = useMutation();
  return (
    <Modal title="Remover matrícula?" busy={mutation.pending} onClose={onClose}>
      <p>
        <strong>{enrollment.student.name}</strong> perderá o acesso a esta turma. As outras
        matrículas permanecerão válidas.
      </p>
      {mutation.error && (
        <p className="feedback warning" role="alert">
          {mutation.error}
        </p>
      )}
      <div className="modal-actions">
        <button className="button secondary" disabled={mutation.pending} onClick={onClose}>
          Manter matrícula
        </button>
        <button
          className="button danger-button"
          disabled={mutation.pending}
          onClick={() =>
            void mutation.run(
              (signal) =>
                call(`/api/classrooms/${classroomId}/enrollments/${enrollment.student.id}`, {
                  method: 'DELETE',
                  signal,
                }),
              onRemoved,
            )
          }
        >
          {mutation.pending ? 'Removendo…' : 'Remover matrícula'}
        </button>
      </div>
    </Modal>
  );
}

export function ClassroomPage({ id }: { id: string }) {
  const { state: auth } = useAuth();
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const resource = useQuery(`/api/classrooms/${id}`, parseClassroom);
  const teacher = auth.phase === 'authenticated' && auth.session.user.role === 'TEACHER';
  return (
    <main className="learning-main">
      <a className="text-link back-link" href="#/turmas">
        <Icon name="left" />
        Minhas turmas
      </a>
      {resource.state.phase === 'loading' && (
        <p className="query-state" role="status">
          Carregando turma…
        </p>
      )}
      {resource.state.phase === 'error' && (
        <section className="learning-panel query-state">
          <h1>Turma indisponível</h1>
          <p className="feedback warning" role="alert">
            {resource.state.message}
          </p>
          <button className="button secondary" onClick={resource.refresh}>
            Consultar novamente
          </button>
        </section>
      )}
      {resource.state.phase === 'ready' && (
        <>
          <section className="classroom-summary">
            <span className="eyebrow">{teacher ? 'SUA TURMA' : 'VOCÊ ESTÁ MATRICULADO'}</span>
            <div className="page-heading">
              <h1>{resource.state.data.name}</h1>
              {teacher && (
                <button className="button secondary" onClick={() => setEditing(true)}>
                  <Icon name="edit" />
                  Editar turma
                </button>
              )}
            </div>
            {resource.state.data.description && (
              <p className="classroom-description">{resource.state.data.description}</p>
            )}
            <div className="teacher-line">
              <span className="avatar" aria-hidden="true">
                {resource.state.data.teacher.name.slice(0, 1).toUpperCase()}
              </span>
              <span>
                <small>Professor responsável</small>
                <strong>{resource.state.data.teacher.name}</strong>
              </span>
            </div>
          </section>
          {notice && (
            <p className="feedback good" role="status">
              {notice}
            </p>
          )}
          {teacher ? (
            <Roster classroomId={id} />
          ) : (
            <section className="learning-panel student-welcome">
              <span className="feature-icon">
                <Icon name="check" />
              </span>
              <h2>Você faz parte desta turma.</h2>
              <p>
                Seu professor organiza a participação por aqui. Enquanto isso, você pode continuar
                praticando com os exemplos Python.
              </p>
              <a className="button secondary" href="#hello">
                Abrir prática livre <Icon name="arrow" />
              </a>
            </section>
          )}
          {editing && (
            <ClassroomForm
              classroom={resource.state.data}
              onClose={() => setEditing(false)}
              onSaved={() => {
                setEditing(false);
                setNotice('Informações da turma atualizadas.');
                resource.refresh();
              }}
            />
          )}
        </>
      )}
    </main>
  );
}
