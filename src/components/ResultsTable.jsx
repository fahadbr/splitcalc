export default function ResultsTable({ results, averagePace, unit }) {
  return (
    <>
      {averagePace && (
        <div className="average-pace">
          Overall Average Pace: {averagePace} /{unit}
        </div>
      )}
      {!results ? (
        <p>Results will appear here after calculation</p>
      ) : (
        <table>
      <thead>
        <tr>
          <th>Split</th>
          <th>Pace</th>
          <th>Segment</th>
          <th>Cumulative</th>
        </tr>
      </thead>
      <tbody>
        {results.rows.map(row => (
          <tr key={row.id}>
            <td>{row.label}</td>
            <td>{row.paceDisplay}</td>
            <td>{row.segmentDisplay}</td>
            <td>{row.cumulativeDisplay}</td>
          </tr>
        ))}
      </tbody>
    </table>
      )}
    </>
  );
}
