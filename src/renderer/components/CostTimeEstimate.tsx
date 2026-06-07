import type { BatchEstimate } from "../../shared/types";

interface CostTimeEstimateProps {
  estimate: BatchEstimate;
}

export function CostTimeEstimate({ estimate }: CostTimeEstimateProps): JSX.Element {
  return (
    <dl className="metric-grid">
      <div>
        <dt>图片数</dt>
        <dd>{estimate.imageCount}</dd>
      </div>
      <div>
        <dt>预计费用</dt>
        <dd>
          ¥{estimate.estimatedCostCny.min} - ¥{estimate.estimatedCostCny.max}
        </dd>
      </div>
      <div>
        <dt>预计耗时</dt>
        <dd>
          {estimate.estimatedAnalysisMinutes.min} - {estimate.estimatedAnalysisMinutes.max} 分钟
        </dd>
      </div>
    </dl>
  );
}
