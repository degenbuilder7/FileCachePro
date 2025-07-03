import React from 'react';
import styles from "./index.module.css";
import SubnetModal from "@/components/SubnetModal";
import Button from "@/reusables/Button";

// Simple SubnetCard placeholder since the original was removed
const SubnetCard = ({ subnet, onSelect }) => (
  <div className="p-4 border rounded-lg bg-white shadow-sm">
    <h3 className="font-semibold">{subnet?.name || 'Subnet'}</h3>
    <p className="text-sm text-gray-600">{subnet?.description || 'Subnet description'}</p>
    <button 
      onClick={() => onSelect(subnet)}
      className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
    >
      Select
    </button>
  </div>
);

export default function SubnetComponent() {
  const [showModal, setShowModal] = React.useState(false);
  const [selectedSubnet, setSelectedSubnet] = React.useState(null);

  // Mock subnet data
  const subnets = [
    { 
      subnetID: 1, 
      name: 'Subnet Alpha', 
      description: 'High-performance subnet for AI workloads' 
    },
    { 
      subnetID: 2, 
      name: 'Subnet Beta', 
      description: 'Cost-effective subnet for data storage' 
    },
  ];

  const handleSubnetSelect = (subnet) => {
    setSelectedSubnet(subnet);
    setShowModal(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Available Subnets</h2>
        <Button onClick={() => setShowModal(true)}>
          Create Subnet
        </Button>
      </div>
      
      <div className={styles.grid}>
        {subnets.map((subnet) => (
          <SubnetCard
            key={subnet.subnetID}
            subnet={subnet}
            onSelect={handleSubnetSelect}
          />
        ))}
      </div>

      {showModal && (
        <SubnetModal
          subnet={selectedSubnet}
          onClose={() => {
            setShowModal(false);
            setSelectedSubnet(null);
          }}
        />
      )}
    </div>
  );
}
