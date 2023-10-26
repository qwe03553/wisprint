<%@ page language="java" pageEncoding="UTF-8"
	contentType="text/html;charset=UTF-8"%>
<%@ page
	import="com.jatools.mireport.*,java.util.*,org.apache.commons.io.*"%>
	<%
	response.setHeader("Cache-Control", "no-cache");
	response.setHeader("Pragma", "no-cache");
	response.setDateHeader("Expires", -1);
	response.setHeader("Access-Control-Allow-Origin","*"); 
%>
<%
	String datasourceName = request.getParameter("ds");
	Config cfg = Config.getInstance();
	DatasourceManager dm = cfg.getDatasourceManager();
	Datasource ds = dm.load(datasourceName);
	
	String result = ds.toString();
	System.out.println("result==>"+result);
%>
<%=result%>