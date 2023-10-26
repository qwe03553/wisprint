<%@ page language="java" pageEncoding="UTF-8"
	contentType="text/html;charset=UTF-8"%>
<%@ page
	import="com.jatools.mireport.*,com.jatools.dddy.*,java.util.*,org.apache.commons.io.*,java.io.File,java.util.regex.*"%>

<%
   String json = request.getParameter("data");
	String result =CachedDataManager.getInstance().put(json) ;
	response.setHeader("Access-Control-Allow-Origin","*"); 
%>
{"cached_id":"<%=result%>"}