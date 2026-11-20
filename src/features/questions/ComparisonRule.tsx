import { COMPARISON_DESCRIPTION } from './api';
export function ComparisonRule({ description = COMPARISON_DESCRIPTION }: { description?: string }) {
  return (
    <section className="comparison-rule" aria-label="Comparação das saídas">
      <h3>Comparação das saídas</h3>
      <p>{description}</p>
      <p className="comparison-example">
        Por exemplo: <code>7</code> e <code>7.0</code> são saídas diferentes.
      </p>
    </section>
  );
}
