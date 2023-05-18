import { ethers } from 'ethers';
import { useEffect, useRef, useState } from 'react';
import { useContext } from 'react';
import { useAccount, useBalance, useContractWrite, useNetwork, useSwitchNetwork, useWaitForTransaction } from 'wagmi';

import { Box, Button, useMediaQuery, useTheme } from '@mui/material';
import { Stack } from '@mui/system';

import abi from '../abi.json';
import { ReadContext } from '../contents/context';
import showMessage from './showMessage';

export default function MintBadge() {
  const { readData } = useContext(ReadContext);
  const { read, counter } = readData;

  const { chain } = useNetwork();
  const { chains, isLoading: swichLoading, switchNetwork } = useSwitchNetwork();

  const { address } = useAccount();
  const theme = useTheme();
  const canvasRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mintLoading, setMintLoading] = useState(false);
  const [modifiedImgSrc, setModifiedImgSrc] = useState('');
  const balance = useBalance({
    address,
  });
  const mdScreen = useMediaQuery(theme.breakpoints.up('md'));

  const { data, writeAsync } = useContractWrite({
    address: '0x43c4Ebf956F7804596c333B209Ff246a476594DA',
    abi: abi,
    functionName: 'mint',
    mode: 'recklesslyUnprepared',
    chainId: 420,
  });
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });
  const handleMint = async () => {
    if (read != counter) {
      showMessage({
        type: 'error',
        title: 'Wrong Network',
        body: 'Please Read All.',
      });
      return;
    }
    if (chain?.id != chains[0]?.id) {
      showMessage({
        type: 'error',
        title: 'Wrong Network',
        body: 'Please Switch to Optimism Mainnet.',
      });
      return;
    }
    try {
      setMintLoading(true);
      const response = await fetch('/api/upload/png', {
        method: 'POST',
        body: modifiedImgSrc,
      });
      const body = await response.json();
      const { cid } = body;
      const data = btoa(
        JSON.stringify({
          name: 'mflayer2-badge',
          description: 'mflayer2-badge',
          image: `ipfs://${cid}`,
        })
      );
      const providerGoerli = new ethers.providers.JsonRpcProvider(`https://opt-goerli.g.alchemy.com/v2/0nH0WXQaohzjhfuOIsjzYWj6MnJpl_4E`);
      const gasPrice = await providerGoerli.getGasPrice();

      const gasUnits = await new ethers.Contract(address, abi, providerGoerli).estimateGas.mint('data:application/json;base64,' + data);

      const transactionFee = gasPrice.mul(gasUnits).mul(3);
      console.log('transactionFee in wei: ' + transactionFee.toString());
      console.log('transactionFee in ether: ' + ethers.utils.formatUnits(transactionFee, 'ether'));
      console.log('balance: ', balance);
      if (transactionFee > balance.data.value) {
        showMessage({
          type: 'error',
          title: 'Estimate Fail',
          body: '您的账户中没有足够的ETH可以支付网络上的交易费用。',
        });
        setMintLoading(false);
        return;
      }
      const res = await writeAsync?.({
        recklesslySetUnpreparedArgs: ['data:application/json;base64,' + data],
      });
      console.log(res);
      setMintLoading(false);
    } catch (err) {
      console.log(err);
      showMessage({
        type: 'error',
        title: 'Estimate Fail',
        body: 'You may have already minted or other reason.',
      });
      setMintLoading(false);
    }
  };
  useEffect(() => {
    if (isSuccess) {
      showMessage({
        type: 'success',
        title: `Mint Successfully`,
      });
    }
  }, [isSuccess]);

  useEffect(() => {
    // 获取 canvas 元素和上下文对象
    const canvas = canvasRef.current;
    console.log('canvas', canvas);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1E1E1E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 在组件加载时，加载图片
    const img = new Image();
    img.src = mdScreen ? '/icons/badge.svg' : '/icons/badge1.svg';
    img.onload = () => {
      // 将图片绘制到 canvas 上
      ctx.drawImage(img, 0, 0);
      setImgLoaded(true);
    };
  }, []);

  useEffect(() => {
    if (imgLoaded) {
      // 获取 canvas 元素和上下文对象
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // 在 canvas 上执行绘制操作
      ctx.fillStyle = '#E9E9E9';
      ctx.font = '96px Open Sans';
      ctx.fillText(`timestamp ${new Date().getTime()}`, mdScreen ? 402 : 190, mdScreen ? 1902 : 1702);
      ctx.fillStyle = '#6C6C6C';
      ctx.font = '40px Open Sans';
      ctx.fillText(address, 530, mdScreen ? 2033 : 1600);

      // 将修改后的图片转换为 base64 格式
      const modifiedImgSrc = canvas.toDataURL('image/png');
      setModifiedImgSrc(modifiedImgSrc);
    }
  }, [imgLoaded]);

  return (
    <Stack
      gap={'28px'}
      marginTop={2}
      alignItems="center"
      sx={{
        background: theme?.palette?.mode === 'dark' ? '#010101' : '#f6f6f6',
        borderRadius: '18px',
        paddingY: '28px',
        // width: ''
      }}
    >
      <Box sx={{ borderRadius: '18px' }}>
        <canvas
          ref={canvasRef}
          width={mdScreen ? 2048 : 1524}
          height={mdScreen ? 2427 : 2000}
          style={{
            zoom: 0.18,
            border: '1px solid #FFFFFF',
            borderRadius: '98px',
          }}
        ></canvas>
      </Box>
      {chain?.id != chains[0]?.id ? (
        <Button
          variant="contained"
          disabled={swichLoading}
          onClick={() => switchNetwork?.(chains[0].id)}
          sx={{
            width: '265px',
            height: '64px',
            fontSize: '20px',
            fontWeight: '800',
            textTransform: 'capitalize',
            borderRadius: '18px',
            background: '#000',
            border: '1px solid #FFFFFF',
            '&:hover': {
              backgroundColor: '#333333',
            },
          }}
        >
          {swichLoading ? 'Changing...' : 'Change Network'}
        </Button>
      ) : (
        <Button
          variant="contained"
          disabled={isLoading | mintLoading}
          onClick={handleMint}
          sx={{
            width: '265px',
            height: '64px',
            fontSize: '20px',
            fontWeight: '800',
            textTransform: 'capitalize',
            borderRadius: '18px',
            background: '#000',
            border: '1px solid #FFFFFF',
            '&:hover': {
              backgroundColor: '#333333',
            },
          }}
        >
          {isLoading | mintLoading ? 'Claiming...' : 'Claim'}
        </Button>
      )}
    </Stack>
  );
}
