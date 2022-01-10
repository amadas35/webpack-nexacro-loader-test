<%@ page import="com.nexacro17.xapi.data.*" %>
<%@ page import="com.nexacro17.xapi.tx.*" %>

<%@ page import = "java.util.*" %>
<%@ page import = "java.sql.*" %>
<%@ page import = "java.io.*" %>
<%@ page import = "java.util.Date" %>
<%@ page import = "java.text.*" %>

<%@ page import = "java.util.Calendar" %>
<%@ page import="org.apache.commons.logging.*" %>

<%!
  static String _CHAR_SET = "UTF-8"; // Default character set
  static String _default_value = "abce한글あいカナぁ𠮷愛!@#$%^&*()_+|><?/\\";
  VariableList outVaList;

  public static StringBuffer getCsvHead(StringBuffer sb) throws Exception {
    return getCsvHead(sb, _CHAR_SET);
  }

  public static StringBuffer getCsvHead(StringBuffer sb, String chrset)
      throws Exception {
    return sb.append("CSV:").append(chrset).append(System.getProperty("line.separator"));
  }

  public StringBuffer getCsvVl(StringBuffer sb) throws Exception {
    if (outVaList != null) {
      int size = outVaList.size();
      for (int i = 0; i < size; i++) {
        Variable var = outVaList.get(i);
        sb.append("\"").append(var.getName())
            .append("=").append(replaceForCsv(var.getString())).append("\",");
      }
      if (0 < size) sb.replace(sb.length()-1, sb.length(), System.getProperty("line.separator"));
    }
    return sb;
  }

  public static StringBuffer getCsvDsHead(StringBuffer sb, DataSet ds)
      throws Exception {
    sb.append("Dataset:").append(ds.getName()).append(System.getProperty("line.separator"));
    int columnCount = ds.getColumnCount();
    for (int i = 0; i < columnCount; i++) {
      sb.append(ds.getColumn(i).getName()).append(":")
          .append(ds.getColumn(i).getDataType()).append(",");
    }
    if (0 < columnCount) sb.replace(sb.length()-1, sb.length(), System.getProperty("line.separator"));
    return sb;
  }

  public static StringBuffer getCsvDsBody(StringBuffer sb, DataSet ds)
      throws Exception {

    int rowCnt = ds.getRowCount();
    int colCnt = ds.getColumnCount();
  //  System.out.println("rowCnt :" + rowCnt);
  //  System.out.println("colCnt :" + colCnt);
    
    if (rowCnt <= 0) return sb;
    
    for (int i = 0; i < rowCnt; i++) {
      for (int j = 0; j < colCnt; j++) {
        Object obj = ds.getObject(i, j);
        if (obj != null) {

          if (obj instanceof String)
          {   	
        	 String t = replaceForCsv(ds.getString(i, j));		
             sb.append("\"").append(t).append("\"");   
          }
          else
          {
              sb.append(ds.getString(i, j));
          }
        }
        if(j < colCnt )
        	sb.append(",");
      }
      
      if (0 < colCnt && i < rowCnt ) sb.replace(sb.length()-1, sb.length(), System.getProperty("line.separator"));
    }
    //return sb.append(System.getProperty("line.separator"));
    return sb;
    
  }


  public static String replaceForCsv(String str) throws Exception {
    String sRtn = str;
    if (str!= null) {
      if (0 <= str.indexOf("\"")) {
        sRtn = str.replaceAll("\"", "\\\\\"");
      }
      if (0 <= str.indexOf(System.getProperty("line.separator"))) {
        sRtn = sRtn.replaceAll(System.getProperty("line.separator"), "\\\\n");
      }
    }
    return sRtn;
  }
  
  public void makeDsData(DataSet ds_out,DataSet ds, int rowcount,int startrow,Boolean bAppend) throws Exception {
  	  
  	java.util.Date in_time = new java.util.Date();
	  	if (!bAppend)
	  	{
	  		//ds_out.addConstantColumn("constCol01",DataTypes.STRING,256,"test");
			for(int i=0; i< ds.getColumnCount(); i++)
			{
			//	String col_name = ds.getColumn(i).getName();
			//	int col_type = ds.getColumn(i).getDataType();
			//	System.out.println(col_name + " ** " + col_type);
				
				ds_out.addColumn(ds.getColumn(i).getName(), ds.getColumn(i).getDataType(), 256);			    
			}
			
		//	ds_out.addColumn("한글컬럼", ds.getColumn(1).getDataType(), 256);			    
		}
		int rs_cnt = 0;
		
		if (rowcount <= 0)
			return;
		if (ds_out.getName().equals("outds05"))
			return;
			
		for(int i=0; i<rowcount; i++)
		{
			int row = ds_out.newRow();
			
			for(int c=0; c <= (ds.getColumnCount()); c++)
			{
//				System.out.println("debug0 > " + c + ":"+ ds.getColumnCount());
				if (c == ds.getColumnCount())
				{
//					System.out.println("debug1");
					//ds_out.set(row,"한글컬럼","test");	
//					System.out.println("debug2");
				}
				else if(c == 0)
				{
					ds_out.set(row, ds.getColumn(c).getName(), String.valueOf(startrow + rs_cnt));
				//	ds_out.set(row, ds.getColumn(c).getName(), "Dataset:aaa");
					rs_cnt++;
				} else {
					    Random rnd = new Random();       						
						ds_out.set(row, ds.getColumn(c).getName(), String.valueOf(rnd.nextInt(9999999)) + "\n" + ds.getString(0, c));
						
					//ds_out.set(row, ds.getColumn(c).getName(), ds.getString(0, c));
				}
				
			}
		}
	/*			
		for( int i=0 ; i < rowcount ; i++ ){
			int row = ds.newRow();
			
			for( int j =0; j < colcount; j++) {
	           //ds.set(row,"col_" + j, (startrow+row) + "_" + j + _default_value );
	           ds.set(row,"col_" + j, (startrow+row) );
			}
		}
		*/
		
  java.util.Date out_time = new java.util.Date();
  
  //System.out.println("the elapsed time of making data : " + (out_time.getTime()-in_time.getTime()));
  }
%>
<%
  out.clearBuffer();
  java.util.Date in_time = new java.util.Date();
	

  PlatformRequest platformRequest = new PlatformRequest(request.getInputStream(), PlatformType.CONTENT_TYPE_XML, _CHAR_SET);
  platformRequest.receiveData();
  PlatformData inPD = platformRequest.getData();
  

  VariableList    inVL  = inPD.getVariableList();
 
   String type = inVL.getString("type"); // XML,CSV,SSV,BINARY
   DataSet ds_in = inPD.getDataSet(0);
  
   int nRowCnt = Integer.parseInt(inVL.getString("rowcount"));
   int recvDsCount = Integer.parseInt(inVL.getString("receiveDsCount"));
   //recvDsCount = 1;
   Boolean bParams = inVL.getBoolean("parameters"); // "parameters"
   Boolean bUseFireFirstRowcount = inVL.getBoolean("usefirefirstrowcount"); // "parameters"
   int[] nFirstCnt = new int[4];
	
   nFirstCnt[0] = Integer.parseInt(inVL.getString("firstrowcount1"));
   nFirstCnt[1] = Integer.parseInt(inVL.getString("firstrowcount2"));
   nFirstCnt[2] = Integer.parseInt(inVL.getString("firstrowcount1"));
   nFirstCnt[3] = Integer.parseInt(inVL.getString("firstrowcount2"));
   

      if (nRowCnt < nFirstCnt[0])
      	     nFirstCnt[0] = nFirstCnt[2] = 0;
      if (nRowCnt < nFirstCnt[1])
      	     nFirstCnt[1] = nFirstCnt[3] = 0;

		
   Boolean bCompress = inVL.getBoolean("compress"); // "bCompress"
   
   DataSet[] out_ds = new DataSet[recvDsCount];
   for (int i = 0; i < recvDsCount; i++)
   {
		out_ds[i] = new DataSet("outds0" + i);
    }
   
   int[] totRow = new int[4];
	
   System.out.println("type : " + type);
   System.out.println("rowcount " + nRowCnt);
      System.out.println("recvDsCount " + recvDsCount);
   
    Random rnd = new Random();       
 	Cookie cookie = new Cookie("nexacookie01",String.valueOf(rnd.nextInt(9999999)));
	cookie.setMaxAge(60*60); // 유효기간 설정 (초)
	//cookie.setSecure(true); // 쿠키를 SSL 이용할때만 전송하도록
	//cookie.setHttpOnly(true); // https 일때(보안)  
	cookie.setPath("/");
	response.addCookie(cookie);
   
   if (nRowCnt <= 0)
   	   return;

   outVaList = new VariableList();
   outVaList.add("ErrorCode", 0);
   outVaList.add("ErrorMsg", " SUCCESS ");
   if (bParams)
   {
	   java.util.Date objDate = new java.util.Date() ;
	SimpleDateFormat sdf = new SimpleDateFormat("HHmmssSSS");
	
	
   		outVaList.add("svr_param1","param1 > " + sdf.format(objDate) );
   		outVaList.add("svr_param2","param2 > " + sdf.format(objDate) );
   }    
   if (type.equals("CSV"))
   {
   	    StringBuffer res1 = new StringBuffer();
  		
  		getCsvHead(res1);
		getCsvVl(res1);
		
		out.println(res1);
		out.flush();

	   	   for (int i = 0; i < recvDsCount; i++)
	   	   {
	   	   	  
	   	   	   makeDsData(out_ds[i],ds_in,nRowCnt,0,false);
	   	   	   
	   	   	   StringBuffer res2 = new StringBuffer();
	   	   	   getCsvDsHead(res2, out_ds[i]);
	   	   	   getCsvDsBody(res2, out_ds[i]);
	   	   	   
	   	   	   out.println(res2);
			   out.println(System.getProperty("line.separator"));
			   out.flush();
			   out_ds[i].clearData();
			   
	   	   }
	   	
   		out.close();					
   }
   else if (type.equals("SSV") || type.equals("XML" ))
   //else if (false)
   {
   	   String ctype = "";
   	   if (type.equals("SSV"))
   	   			ctype = PlatformType.CONTENT_TYPE_SSV;
   	   else if (type.equals("XML"))
   	   		ctype = PlatformType.CONTENT_TYPE_XML;

   		HttpPartPlatformResponse res = new HttpPartPlatformResponse(response, ctype);
   		if (bCompress == true)
		{
			System.out.println("===> bCompress PlatformType.PROTOCOL_TYPE_ZLIB");
			res.addProtocolType(PlatformType.PROTOCOL_TYPE_ZLIB);
		}
		
   		res.sendVariable( outVaList.get("ErrorCode"));
  		res.sendVariable( outVaList.get("ErrorMsg"));
  		if (bParams)
  		{
        	res.sendVariable( outVaList.get("svr_param1"));
        	res.sendVariable( outVaList.get("svr_param2"));
        }
  		
  		for (int i = 0; i < recvDsCount; i++)
   	   {

   	   	   for (int j = 0; j < 2; j++)
   	   	   {
	   	   	   if (j == 0)
	   	   	   {
	   	   	   		
		   	   		makeDsData(out_ds[i],ds_in,nFirstCnt[i],0,false);
		   	   		totRow[i] = out_ds[i].getRowCount();
		   	   		
		   	   		res.sendDataSet(out_ds[i]);
				}
				else
				{
					int count = 0;
					while(true)
					{
						int sendRowCnt;
						int nextCount = 500;
						
						if ((totRow[i] + nextCount) > nRowCnt)
							sendRowCnt = nRowCnt - totRow[i];
						else
							sendRowCnt = nextCount;
							
						makeDsData(out_ds[i],ds_in,sendRowCnt,totRow[i],true);
						totRow[i] += out_ds[i].getRowCount();
						
						 System.out.println(out_ds[i].getName() + " send data [" + count++ + "]");
						res.sendDataSet(out_ds[i]);
						
						if (totRow[i] >= nRowCnt)
							break;
					}
					
				}
  		   }
  		   
   		}
   		
   		res.end();
   }
   else		//BINARIY
   {
	   java.util.Date date = new java.util.Date();
		
   	  //response.setDateHeader("Last-Modified",date.getTime());
   	   
	  //long clientDate = request.getDateHeader("If-Modified-Since");
      //response.setStatus(304);
      
   	    String ctype = "";
   	   if (type.equals("SSV"))
   	   			ctype = PlatformType.CONTENT_TYPE_SSV;
   	   else if (type.equals("XML"))
   	   		ctype = PlatformType.CONTENT_TYPE_XML;
   	   else
   	   	   ctype = PlatformType.CONTENT_TYPE_BINARY;
   	   
   	   System.out.println("start " + ctype + "-data!! ");
   	   
   	   PlatformData o_xpData = new PlatformData();
   	           
   	   HttpPlatformResponse res = new HttpPlatformResponse(response, ctype, _CHAR_SET);
       try {	       
	       DataSet dummy_ds1 = new DataSet("dummy_ds1");
	   	   DataSet dummy_ds2 = new DataSet("dummy_ds2");
	       
	       //o_xpData.addDataSet(dummy_ds1);
	       for (int i = 0; i < recvDsCount; i++)
	   	   {
	   	   	   makeDsData(out_ds[i],ds_in,nRowCnt,0,false);
	   	   	   o_xpData.addDataSet(out_ds[i]);
	   	   }
	   	   
	   	   //o_xpData.addDataSet(dummy_ds2);
	   	   
	   	   
	   	   
	   	 	if (bCompress == true)
			{
			     System.out.println("===> bCompress PlatformType.PROTOCOL_TYPE_ZLIB");
				res.addProtocolType(PlatformType.PROTOCOL_TYPE_ZLIB);
			}
	   }
	   catch(Exception e) {
	   	    System.out.println("ERROR binary-data!! ");
	   	    outVaList.set("ErrorCode", -1);
   		    outVaList.set("ErrorMsg", e.getMessage()+"\n");
		}

       o_xpData.setVariableList(outVaList);
	   res.setData(o_xpData); 

       res.sendData();
       
       System.out.println("end " + ctype + "-data!! ");
      
   }
   java.util.Date out_time = new java.util.Date();
  
    System.out.println("the elapsed time of Server : " + (out_time.getTime()-in_time.getTime()));
    
%>