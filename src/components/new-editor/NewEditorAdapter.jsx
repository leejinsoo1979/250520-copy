import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Editor } from './Editor';

const NewEditorAdapter = () => {
  const { id } = useParams(); // URL 파라미터에서 디자인 ID 추출
  const [designData, setDesignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 디자인 데이터 로드
  useEffect(() => {
    const loadDesignData = async () => {
      try {
        // 먼저 세션 스토리지에서 마지막으로 저장된 디자인 데이터를 확인
        const lastDesignDataJSON = sessionStorage.getItem('lastDesignData');
        let foundData = null;
        
        if (lastDesignDataJSON) {
          const lastDesignData = JSON.parse(lastDesignDataJSON);
          
          // 저장된 디자인 ID와 URL의 ID가 일치하는지 확인
          if (lastDesignData.id === id) {
            console.log('세션 스토리지에서 디자인 데이터 발견:', lastDesignData);
            foundData = lastDesignData;
          }
        }
        
        // 세션 스토리지에 데이터가 없거나 ID가 일치하지 않으면 로컬 스토리지 확인
        if (!foundData) {
          const projectsJSON = localStorage.getItem('projects');
          if (projectsJSON) {
            const projects = JSON.parse(projectsJSON);
            
            // 모든 프로젝트에서 일치하는 디자인 ID 탐색
            const findDesignInProjects = (projects) => {
              let found = null;
              
              for (const project of projects) {
                if (project.children) {
                  const findInChildren = (children) => {
                    for (const child of children) {
                      if (child.id === id) {
                        return child;
                      }
                      if (child.children) {
                        const foundInSubChildren = findInChildren(child.children);
                        if (foundInSubChildren) return foundInSubChildren;
                      }
                    }
                    return null;
                  };
                  
                  found = findInChildren(project.children);
                  if (found) break;
                }
              }
              
              return found;
            };
            
            foundData = findDesignInProjects(projects);
            if (foundData) {
              console.log('로컬 스토리지에서 디자인 데이터 발견:', foundData);
            }
          }
        }
        
        if (foundData) {
          setDesignData(foundData);
        } else {
          // 데이터를 찾을 수 없는 경우 Mock 데이터 사용
          const mockData = {
            id: id || '1',
            title: '옷장 디자인 #1',
            dimensions: {
              width: 2400,
              height: 2400,
              depth: 600
            },
            components: []
          };
          setDesignData(mockData);
        }
        
        setLoading(false);
      } catch (err) {
        setError('디자인 데이터를 불러오는데 실패했습니다.');
        setLoading(false);
        console.error(err);
      }
    };

    loadDesignData();
  }, [id]);

  // 로딩 중 화면
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-editor-primary"></div>
        <p className="ml-4">디자인 데이터를 불러오는 중...</p>
      </div>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-bold text-red-500">오류가 발생했습니다</h2>
        <p className="mt-2">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-editor-primary text-white rounded-md"
          onClick={() => window.location.reload()}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return <Editor initialData={designData} />;
};

export default NewEditorAdapter; 