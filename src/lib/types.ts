export interface Region {
  id: string;
  name: string;
  code: string;
}

export interface Supplier {
  id: string;
  name: string;
  tier: string;
  reliabilityScore: number;
  region?: string;
  productCount?: number;
}

export interface Component {
  id: string;
  name: string;
  category: string;
  critical: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  line: string;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
}

export interface DashboardStats {
  suppliers: number;
  components: number;
  products: number;
  facilities: number;
}

export interface ImpactResult {
  id: string;
  name: string;
  sku: string;
  affectedComponents: string[];
  hopCount: number;
}

export interface SinglePointOfFailure {
  supplier: string;
  component: string;
  productCount: number;
  products: string[];
}

export interface RegionalRisk {
  product: string;
  region: string;
  criticalCount: number;
  supplierCount: number;
}

export interface Alternative {
  id: string;
  name: string;
  category: string;
  supplier: string;
  reliabilityScore: number;
}

export interface ProductBomItem {
  componentId: string;
  componentName: string;
  category: string;
  critical: boolean;
  quantity: number;
  suppliers: Array<{
    id: string;
    name: string;
    leadTimeDays: number;
    unitCost: number;
  }>;
  dependencies: Array<{
    id: string;
    name: string;
  }>;
}

export interface SupplierDetail extends Supplier {
  components: Array<{
    id: string;
    name: string;
    category: string;
    critical: boolean;
    unitCost: number;
    leadTimeDays: number;
  }>;
  affectedProducts: string[];
}
