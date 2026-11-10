import { useState } from 'react';
import type { Exercise } from '../exercises';
import { Icon } from '../../../shared/ui/Icon';

export function ProblemPanel({
  exercise,
  onExample,
}: {
  exercise: Exercise;
  onExample: (index: number) => void;
}) {
  const [tab, setTab] = useState<'description' | 'examples'>('description');
  return (
    <section className="panel problem-panel" aria-label="Exercício de prática">
      <div className="panel-tabs" role="tablist" aria-label="Informações do exercício">
        <button
          id="description-tab"
          role="tab"
          aria-selected={tab === 'description'}
          aria-controls="description-content"
          className={tab === 'description' ? 'tab active' : 'tab'}
          onClick={() => setTab('description')}
        >
          <Icon name="file" className="blue" />
          Enunciado
        </button>
        <button
          id="examples-tab"
          role="tab"
          aria-selected={tab === 'examples'}
          aria-controls="examples-content"
          className={tab === 'examples' ? 'tab active' : 'tab'}
          onClick={() => setTab('examples')}
        >
          <Icon name="flask" className="amber" />
          Exemplos<span className="count">{exercise.examples.length}</span>
        </button>
      </div>
      <div className="problem-scroll">
        <div
          id="description-content"
          role="tabpanel"
          aria-labelledby="description-tab"
          hidden={tab !== 'description'}
        >
          <div className="eyebrow">COMECE PELO BÁSICO</div>
          <h1>
            <span className="problem-number">{exercise.number}.</span> {exercise.title}
          </h1>
          <div className="tags">
            <span className="tag green-tag">Introdutório</span>
            <span className="tag">{exercise.topic}</span>
          </div>
          <div className="prose">
            {exercise.description.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
          <h2>Um exemplo para começar</h2>
          <div className="example-card">
            <div>
              <span>Entrada</span>
              <pre>{exercise.examples[0].input || 'Sem entrada'}</pre>
            </div>
            <div>
              <span>Saída esperada</span>
              <pre>{exercise.examples[0].expected || '(vazia)'}</pre>
            </div>
          </div>
          <p className="example-note">{exercise.examples[0].note}</p>
          <h2>Antes de executar</h2>
          <ul className="instruction-list">
            {exercise.instructions.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <div className="learning-note">
            <Icon name="bolt" />
            <div>
              <strong>Aprender também é experimentar.</strong>
              <p>Mude uma linha, escolha outra entrada e observe o resultado.</p>
            </div>
          </div>
        </div>
        <div
          id="examples-content"
          role="tabpanel"
          aria-labelledby="examples-tab"
          hidden={tab !== 'examples'}
        >
          <div className="eyebrow">EXPLORE AS ENTRADAS</div>
          <h2 className="examples-title">Exemplos públicos</h2>
          <p className="muted">
            Escolha um caso para carregar a entrada e a saída esperada. Cada execução testa um caso.
          </p>
          {exercise.examples.map((example, index) => (
            <article className="example-card selectable-example" key={index}>
              <header>
                <strong>Caso {index + 1}</strong>
                <button className="text-button" onClick={() => onExample(index)}>
                  Usar este caso <Icon name="arrow" />
                </button>
              </header>
              <div>
                <span>Entrada</span>
                <pre>{example.input || 'Sem entrada'}</pre>
              </div>
              <div>
                <span>Saída esperada</span>
                <pre>{example.expected || '(vazia)'}</pre>
              </div>
              <p>{example.note}</p>
            </article>
          ))}
        </div>
      </div>
      <footer className="problem-footer">
        <span className="small-dot" />
        Exemplos de prática · sem entrega avaliativa
      </footer>
    </section>
  );
}
