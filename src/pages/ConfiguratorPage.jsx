import React from 'react';
import Toolbar from '../components/configurator/Toolbar';
import ComponentPanel from '../components/configurator/ComponentPanel';
import Workspace from '../components/configurator/Workspace';
import PropertiesPanel from '../components/configurator/PropertiesPanel';
import { useConfigurator } from '../hooks/useConfigurator';
import '../styles/pages/configurator.css';

const ConfiguratorPage = () => {
  const {
    selectedComponent,
    components,
    addComponent,
    updateComponent,
    deleteComponent,
    selectComponent,
  } = useConfigurator();

  return (
    <div className="configurator-container">
      <Toolbar />
      <div className="configurator-main">
        <ComponentPanel onAddComponent={addComponent} />
        <Workspace
          components={components}
          selectedComponent={selectedComponent}
          onSelect={selectComponent}
        />
        <PropertiesPanel
          component={selectedComponent}
          onUpdate={updateComponent}
          onDelete={deleteComponent}
        />
      </div>
    </div>
  );
};

export default ConfiguratorPage; 