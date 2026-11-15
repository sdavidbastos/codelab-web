import type { QuestionContent } from './api';
export function QuestionPreview({ content }: { content: QuestionContent }) {
  const details = [
    ['Objetivo de aprendizagem', content.learningObjective],
    ['Entrada', content.inputDescription],
    ['Saída', content.outputDescription],
    ['Restrições', content.constraints],
  ];
  return (
    <div className="question-preview">
      <section className="learning-panel">
        <h2>Enunciado</h2>
        <p className="preserve-text">{content.statement}</p>
        {details.map(
          ([title, value]) =>
            value && (
              <div className="preview-section" key={title}>
                <h3>{title}</h3>
                <p className="preserve-text">{value}</p>
              </div>
            ),
        )}
      </section>
      <section className="learning-panel">
        <h2>Código inicial</h2>
        <pre aria-label="Código inicial publicado">
          {content.starterCode || '(sem código inicial)'}
        </pre>
        <dl className="question-limits">
          <div>
            <dt>Linguagem</dt>
            <dd>Python 3</dd>
          </div>
          <div>
            <dt>CPU</dt>
            <dd>{content.cpuTimeLimitSeconds} s</dd>
          </div>
          <div>
            <dt>Tempo de parede</dt>
            <dd>{content.wallTimeLimitSeconds} s</dd>
          </div>
          <div>
            <dt>Memória</dt>
            <dd>{content.memoryLimitKb.toLocaleString('pt-BR')} KB</dd>
          </div>
        </dl>
      </section>
      <section className="learning-panel">
        <h2>
          Casos públicos <span className="count-pill">{content.testCases.length}</span>
        </h2>
        {content.testCases.map((item) => (
          <article className="public-case" key={item.id}>
            <h3>Caso {item.position}</h3>
            <div className="case-io">
              <div>
                <h4>Entrada</h4>
                <pre aria-label={`Entrada publicada do caso ${item.position}`}>
                  {item.stdin || '(entrada vazia)'}
                </pre>
              </div>
              <div>
                <h4>Saída esperada</h4>
                <pre aria-label={`Saída publicada do caso ${item.position}`}>
                  {item.expectedOutput === '' ? '(saída vazia)' : item.expectedOutput}
                </pre>
              </div>
            </div>
            {item.explanation && <p className="preserve-text">{item.explanation}</p>}
          </article>
        ))}
      </section>
    </div>
  );
}
