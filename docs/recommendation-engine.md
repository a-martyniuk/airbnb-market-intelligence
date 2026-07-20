# Projections & Simulation Engine Specification

This document provides a technical specification for the revenue projections and strategy simulator, including formulas, variables, and scenario multipliers.

---

## 📊 Revenue & RevPAR Simulation Equations

The simulator in the frontend computes dynamic RevPAR projections based on pricing adjustments.

### 1. Variables
- \(P_{base}\): Published listing base price.
- \(C_{fee}\): Cleaning fee.
- \(S_{days}\): Average stay duration (days).
- \(Occ_{base}\): Baseline historical occupancy rate (0 to 100).
- \(\Delta_{pct}\): Simulated price slider multiplier percentage (e.g. -30% to +30%).

### 2. Prorated Cleaning Fee (\(C_{prorated}\))
The cleaning fee is prorated across the average stay duration:
\[C_{prorated} = \frac{C_{fee}}{S_{days}}\]

### 3. Simulated Occupancy Rate (\(Occ_{sim}\))
The simulated occupancy rate is calculated using a **logistic sigmoidal demand curve** representing price elasticity. As prices rise, occupancy falls non-linearly:
\[Occ_{sim} = \max\left(5, \min\left(99, \frac{2 \cdot Occ_{base}}{1 + e^{0.045 \cdot \Delta_{pct}}}\right)\right)\]

### 4. RevPAR Calculations
- **Baseline RevPAR (\(RevPAR_{base}\))**:
  \[RevPAR_{base} = (P_{base} + C_{prorated}) \cdot \frac{Occ_{base}}{100}\]
- **Simulated RevPAR (\(RevPAR_{sim}\))**:
  \[P_{sim} = P_{base} \cdot \left(1 + \frac{\Delta_{pct}}{100}\right)\]
  \[RevPAR_{sim} = (P_{sim} + C_{prorated}) \cdot \frac{Occ_{sim}}{100}\]

### 5. Projected Revenues
- **Monthly Simulated Revenue**:
  \[Revenue_{30d} = RevPAR_{sim} \cdot 30\]
- **Annual Simulated Revenue**:
  \[Revenue_{365d} = RevPAR_{sim} \cdot 365\]

---

## 🔮 Forecast Scenarios

The 12-month projections page displays three cumulative revenue scenario strategies:

1. **Balanceado (Recommended)**: Base recommendation path determined by the ML model.
2. **Conservador**: Applies a low-risk, volume-maximizing discount factor (\(-10\%\) price, targeting $+15\%$ higher occupancy).
3. **Agresivo**: Applies a high-margin, premium positioning premium markup factor (\(+15\%\) price, anticipating $-20\%$ lower occupancy).
