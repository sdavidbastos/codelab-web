import { useAuth } from '../auth/AuthProvider';
import { useMutation } from '../auth/hooks';
import { Modal } from '../../shared/ui/Modal';
import { useLeaveGuard } from '../../shared/ui/useLeaveGuard';
import { parseQuestion, type Question } from './api';
export function PublishQuestion({
  question,
  onClose,
  onPublished,
}: {
  question: Question;
  onClose: () => void;
  onPublished: (value: Question) => void;
}) {
  const { call } = useAuth();
  const mutation = useMutation();
  useLeaveGuard(false, mutation.pending);
  return (
    <Modal title="Publicar esta versão?" busy={mutation.pending} onClose={onClose}>
      <p>
        <strong>{question.title}</strong> será preservado como uma nova versão, com{' '}
        {question.testCases.length}{' '}
        {question.testCases.length === 1 ? 'caso público' : 'casos públicos'}. Para alterar depois,
        abra um novo rascunho.
      </p>
      <p>Publicar não disponibiliza o exercício automaticamente para uma turma.</p>
      {mutation.error && (
        <p className="feedback warning" role="alert">
          {mutation.error}
        </p>
      )}
      <div className="modal-actions">
        <button
          type="button"
          className="button secondary"
          disabled={mutation.pending}
          onClick={onClose}
        >
          Continuar no rascunho
        </button>
        <button
          type="button"
          className="button primary"
          disabled={mutation.pending}
          onClick={() =>
            void mutation.run(
              async (signal) =>
                parseQuestion(
                  await call(`/api/questions/${question.id}/publish`, {
                    method: 'POST',
                    signal,
                    messages: {
                      409: 'Não foi possível publicar. Consulte o rascunho e seus casos antes de tentar novamente.',
                    },
                  }),
                ),
              onPublished,
            )
          }
        >
          {mutation.pending ? 'Publicando…' : 'Confirmar publicação'}
        </button>
      </div>
    </Modal>
  );
}
export function DeleteQuestion({ question, onClose }: { question: Question; onClose: () => void }) {
  const { call } = useAuth();
  const mutation = useMutation();
  const allowNextNavigation = useLeaveGuard(false, mutation.pending);
  return (
    <Modal title="Excluir este rascunho?" busy={mutation.pending} onClose={onClose}>
      <p>
        O rascunho <strong>{question.title}</strong> e seus casos serão excluídos. Esta ação não
        pode ser desfeita.
      </p>
      {mutation.error && (
        <p className="feedback warning" role="alert">
          {mutation.error}
        </p>
      )}
      <div className="modal-actions">
        <button
          type="button"
          className="button secondary"
          disabled={mutation.pending}
          onClick={onClose}
        >
          Manter rascunho
        </button>
        <button
          type="button"
          className="button danger-button"
          disabled={mutation.pending}
          onClick={() =>
            void mutation.run(
              (signal) =>
                call(`/api/questions/${question.id}`, {
                  method: 'DELETE',
                  signal,
                  messages: {
                    409: 'Este exercício tem versões publicadas e não pode ser excluído.',
                  },
                }),
              () => {
                allowNextNavigation();
                window.location.hash = '/exercicios';
              },
            )
          }
        >
          {mutation.pending ? 'Excluindo…' : 'Excluir definitivamente'}
        </button>
      </div>
    </Modal>
  );
}
