import axios from 'axios';
import {useEffect, useState} from 'react';

export const useIDEStatus = ({enabled}: {enabled: boolean}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasTried, setHasTried] = useState(false);
  const [ideRunning, setIdeRunning] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (enabled) {
      setHasTried(true);
      axios.get('/api/ide/status').then((res) => {
        setIsLoading(false);
        setIdeRunning(res.data === true)
      })
    }
  }, [])

  return {ideRunning, isLoading, hasTried};

}