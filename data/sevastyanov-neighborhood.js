// Modern appearance only; dates below are display cutovers, not construction dates.
export const SEVASTYANOV_NEIGHBOR_YEAR = 2009;
export const SEVASTYANOV_NEIGHBOR_IDS = Object.freeze([51503512,-421103,51503506]);
const ids = new Set(SEVASTYANOV_NEIGHBOR_IDS);
export const neighborhoodReplacementYear = id => ids.has(id) ? SEVASTYANOV_NEIGHBOR_YEAR : 9999;

// Approximate internal height partitions, fitted inside the authoritative GEO outline.
// See assets/models/SEVASTYANOV-NEIGHBORS.md. Exterior outlines are never replaced by these masks.
export const TARASOV_PARTS = [
  {
    "id": "south_link",
    "role": "connector",
    "levels": 1,
    "height": 3.5,
    "roofRise": 0,
    "mask": [
      [
        62.759669,
        99.71124
      ],
      [
        213.168896,
        70.474897
      ],
      [
        184.733807,
        -103.483072
      ],
      [
        28.33915,
        -77.36547
      ]
    ]
  },
  {
    "id": "modern_east_south",
    "role": "modern",
    "levels": 5,
    "height": 17.5,
    "roofRise": 1.1,
    "mask": [
      [
        213.168896,
        70.474897
      ],
      [
        397.40815,
        34.662718
      ],
      [
        364.712731,
        -133.5392
      ],
      [
        184.733807,
        -103.483072
      ]
    ]
  },
  {
    "id": "modern_east_main",
    "role": "modern",
    "levels": 5,
    "height": 17.5,
    "roofRise": 1.1,
    "mask": [
      [
        364.712731,
        -133.5392
      ],
      [
        332.359075,
        -299.982912
      ],
      [
        154.283867,
        -265.368893
      ],
      [
        181.401623,
        -102.926604
      ]
    ]
  },
  {
    "id": "historical_main_west",
    "role": "historical",
    "levels": 2,
    "height": 8.2,
    "roofRise": 1.1,
    "mask": [
      [
        23.244102,
        -103.576998
      ],
      [
        28.33915,
        -77.36547
      ],
      [
        162.692717,
        -99.802253
      ],
      [
        158.299639,
        -126.089694
      ]
    ]
  },
  {
    "id": "low_south_bridge",
    "role": "connector",
    "levels": 2,
    "height": 8,
    "roofRise": 1.1,
    "mask": [
      [
        159.153125,
        -120.982576
      ],
      [
        162.692717,
        -99.802253
      ],
      [
        181.401623,
        -102.926604
      ],
      [
        177.865202,
        -124.110668
      ]
    ]
  },
  {
    "id": "historical_west_spine",
    "role": "historical",
    "levels": 2,
    "height": 8.2,
    "roofRise": 1.1,
    "mask": [
      [
        154.567506,
        -148.422154
      ],
      [
        18.930905,
        -125.766284
      ],
      [
        23.244102,
        -103.576998
      ],
      [
        158.299639,
        -126.089694
      ]
    ]
  },
  {
    "id": "historical_north_wing",
    "role": "historical",
    "levels": 2,
    "height": 8.2,
    "roofRise": 1.1,
    "mask": [
      [
        132.362456,
        -261.107839
      ],
      [
        -2.289406,
        -234.934391
      ],
      [
        18.930905,
        -125.766284
      ],
      [
        151.285755,
        -147.873991
      ]
    ]
  },
  {
    "id": "modern_north_inner",
    "role": "modern",
    "levels": 5,
    "height": 17.5,
    "roofRise": 1.1,
    "mask": [
      [
        173.28478,
        -151.548567
      ],
      [
        154.567506,
        -148.422154
      ],
      [
        155.207331,
        -144.593548
      ],
      [
        173.925497,
        -147.710508
      ]
    ]
  },
  {
    "id": "modern_north_outer",
    "role": "modern",
    "levels": 5,
    "height": 17.5,
    "roofRise": 1.1,
    "mask": [
      [
        154.283867,
        -265.368893
      ],
      [
        132.362456,
        -261.107839
      ],
      [
        151.285755,
        -147.873991
      ],
      [
        173.28478,
        -151.548567
      ]
    ]
  }
];

export const NEIGHBOR_DESIGNS = Object.freeze({
  51503512:{name:'Ленина, 37',height:9.05,roofRise:1.35,levels:2,mezzanineHeight:3.0},
  '-421103':{name:'Горького, 21 — комплекс усадьбы Тарасовых',height:17.5,levels:5},
  51503506:{name:'Низкий корпус к югу от усадьбы Тарасовых',height:8.2,roofRise:1.15,levels:2},
});
